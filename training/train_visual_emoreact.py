"""
Train LSTM model for visual emotion recognition using EmoReact dataset
Uses MediaPipe features (blendshapes, head pose, pose landmarks) as sequential input
Total: 154 features per frame (52 blendshapes + 3 head pose + 99 pose landmarks)

IMPORTANT: This is a MULTI-LABEL classification problem.
- Multiple emotions can be active simultaneously (e.g., happy + surprised)
- Uses SIGMOID activation (not softmax) to allow independent predictions
- Softmax would force single-label classification (wrong for this task)
- Focal loss handles class imbalance (some emotions are rare)
"""

import os
import warnings
warnings.filterwarnings('ignore')

import numpy as np
from sklearn.metrics import classification_report, multilabel_confusion_matrix
from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
import json
# Import tensorflowjs only when needed (lazy import to avoid dependency issues)

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from load_emoreact_dataset import prepare_training_data, EMOTION_LABELS

# Configure GPU
print("Configuring GPU...")
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        # Enable memory growth to avoid allocating all GPU memory at once
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print(f"Found {len(gpus)} GPU(s). Using GPU for training.")
        print(f"GPU device: {gpus[0]}")
    except RuntimeError as e:
        print(f"GPU configuration error: {e}")
else:
    print("No GPU found. Using CPU for training.")
    print("\nNOTE: TensorFlow 2.20+ doesn't support GPU on native Windows.")
    print("To use GPU, you have two options:")
    print("  1. Downgrade to TensorFlow 2.10: pip install tensorflow==2.10.0")
    print("  2. Use WSL2 (Windows Subsystem for Linux)")
    print("\nYour GPU (NVIDIA GeForce RTX 4050) is detected by drivers but TensorFlow can't use it on Windows.")

def augment_data(X, y):
    """
    Creates synthetic data to multiply dataset size and prevent overfitting.
    Since we're working with features (not images), we use signal-level augmentation.
    
    Input: X (N, Time, Feat), y (N, Classes)
    Output: X_aug (N*4, Time, Feat), y_aug (N*4, Classes)
    
    Augmentation strategies:
    1. Gaussian Noise: Adds random jitter (simulates camera noise)
    2. Scaling: Slightly scales values up/down (simulates exaggerated/subtle expressions)
    3. Time Masking: Randomly zeros out chunks of time (forces model to use context)
    """
    print(f"\nAugmenting data... Original size: {len(X)}")
    
    X_aug = [X]
    y_aug = [y]
    
    # 1. Add Gaussian Noise (Jitter) - simulates camera noise
    # Use small noise relative to feature scale (2% of typical feature value)
    noise_std = 0.02 * np.std(X)  # Scale noise to feature standard deviation
    noise = np.random.normal(0, noise_std, X.shape)
    X_noisy = X + noise
    X_aug.append(X_noisy)
    y_aug.append(y)
    print(f"  Added noisy version: {len(X_noisy)} samples (noise std: {noise_std:.4f})")
    
    # 2. Scaling (Exaggerate/Dampen expressions)
    # Multiply by random factor between 0.9 and 1.1
    scale = np.random.uniform(0.9, 1.1, size=(X.shape[0], 1, 1))
    X_scaled = X * scale
    X_aug.append(X_scaled)
    y_aug.append(y)
    print(f"  Added scaled version: {len(X_scaled)} samples")
    
    # 3. Time Masking (Drop random 10% of frames)
    # Forces model not to rely on a specific moment
    X_masked = X.copy()
    mask_len = max(1, int(X.shape[1] * 0.1))  # Mask 10% of sequence (min 1 frame)
    for i in range(len(X_masked)):
        if X.shape[1] > mask_len:
            start = np.random.randint(0, X.shape[1] - mask_len)
            X_masked[i, start:start+mask_len, :] = 0
    X_aug.append(X_masked)
    y_aug.append(y)
    print(f"  Added time-masked version: {len(X_masked)} samples")
    
    X_augmented = np.concatenate(X_aug, axis=0)
    y_augmented = np.concatenate(y_aug, axis=0)
    
    print(f"  Final augmented size: {len(X_augmented)} (4x original)")
    
    return X_augmented, y_augmented

def analyze_data_characteristics(data):
    """Analyze data to inform architecture decisions"""
    print("\n" + "=" * 60)
    print("Data Analysis")
    print("=" * 60)
    
    X_train = data['X_train']
    y_train = data['y_train']
    
    print(f"\nSequence shape: {X_train.shape}")
    print(f"  Batch size: {X_train.shape[0]}")
    print(f"  Max sequence length: {X_train.shape[1]}")
    if X_train.shape[2] == 89:
        print(f"  Features per frame: {X_train.shape[2]} (52 blendshapes + 3 head pose + 34 upper body pose landmarks)")
        print(f"    Upper body: 17 landmarks (face + shoulders + arms + upper torso) × 2 coords (x,y)")
    elif X_train.shape[2] == 121:
        print(f"  Features per frame: {X_train.shape[2]} (52 blendshapes + 3 head pose + 66 pose landmarks - z dropped)")
    elif X_train.shape[2] == 154:
        print(f"  Features per frame: {X_train.shape[2]} (52 blendshapes + 3 head pose + 99 pose landmarks - full 3D)")
    else:
        print(f"  Features per frame: {X_train.shape[2]}")
    
    # Label statistics
    print(f"\nLabel statistics:")
    for i, emotion in enumerate(EMOTION_LABELS):
        if emotion == 'valence':
            # Valence is continuous (1-7)
            mean_val = np.mean(y_train[:, i])
            std_val = np.std(y_train[:, i])
            print(f"  {emotion}: mean={mean_val:.2f}, std={std_val:.2f}, range=[{np.min(y_train[:, i]):.1f}, {np.max(y_train[:, i]):.1f}]")
        else:
            # Other emotions are 1-4 scale
            # Count non-zero (active) emotions
            active = np.sum(y_train[:, i] > 0)
            mean_val = np.mean(y_train[:, i])
            print(f"  {emotion}: active={active}/{len(y_train)} ({active/len(y_train)*100:.1f}%), mean={mean_val:.2f}")
    
    # Feature statistics
    print(f"\nFeature statistics:")
    print(f"  Mean: {np.mean(X_train):.4f}")
    print(f"  Std: {np.std(X_train):.4f}")
    print(f"  Min: {np.min(X_train):.4f}")
    print(f"  Max: {np.max(X_train):.4f}")

def build_visual_crnn_model(
    input_shape,
    num_classes,
    lstm_units=128,
    num_lstm_layers=2,
    dense_units=128,
    num_dense_layers=2,
    dropout_rate=0.3,
    output_bias=None,
    reduce_pose_dim=True
):
    """
    Build CRNN (Convolutional Recurrent Neural Network) model for visual emotion recognition.
    
    Architecture:
    1. Conv1D + MaxPooling: Reduces sequence length (e.g., 508 → ~127 frames)
    2. Bidirectional LSTM: Looks both ways in time
    3. GlobalMaxPooling: Captures peak emotions from entire sequence (not diluted by averaging)
    4. Dense layers: Final classification
    
    This architecture solves the vanishing gradient problem for long sequences.
    GlobalMaxPooling is critical for detecting brief emotional spikes (micro-expressions).
    
    Args:
        input_shape: (sequence_length, features_per_frame)
        num_classes: Number of emotion classes (9)
        lstm_units: Number of LSTM units
        num_lstm_layers: Number of LSTM layers
        dense_units: Number of units in dense layers
        num_dense_layers: Number of dense layers
        dropout_rate: Dropout rate
        output_bias: Initial bias for output layer
        reduce_pose_dim: If True, reduce pose landmarks from 99 to 33 features (use only x,y, drop z)
    """
    if output_bias is not None:
        output_bias = tf.keras.initializers.Constant(output_bias)
    
    model = keras.Sequential()
    
    # Input layer
    model.add(layers.Input(shape=input_shape, name='input_layer'))
    
    # Masking layer for variable-length sequences
    model.add(layers.Masking(mask_value=0.0))
    
    # ==========================================
    # CONVOLUTIONAL BLOCK: Reduce sequence length
    # ==========================================
    # Conv1D: Extract temporal patterns and reduce sequence length
    model.add(layers.Conv1D(
        filters=64,
        kernel_size=3,
        padding='same',
        activation='relu',
        name='conv1d'
    ))
    model.add(layers.BatchNormalization(name='batch_normalization'))
    model.add(layers.MaxPooling1D(pool_size=2, name='max_pooling1d'))  # Reduce sequence by 2x
    
    model.add(layers.Conv1D(
        filters=128,
        kernel_size=3,
        padding='same',
        activation='relu',
        name='conv1d_1'
    ))
    model.add(layers.BatchNormalization(name='batch_normalization_1'))
    model.add(layers.MaxPooling1D(pool_size=2, name='max_pooling1d_1'))  # Reduce sequence by 2x more
    
    # After 2 pooling layers: 508 → 127 frames (much easier for LSTM!)
    model.add(layers.Dropout(dropout_rate, name='dropout'))
    
    # ==========================================
    # RECURRENT BLOCK: Bidirectional LSTM layers
    # ==========================================
    for i in range(num_lstm_layers):
        return_sequences = i < num_lstm_layers - 1  # Only last layer doesn't return sequences
        model.add(layers.Bidirectional(
            layers.LSTM(
                lstm_units,
                return_sequences=return_sequences,
                dropout=dropout_rate,
                recurrent_dropout=dropout_rate * 0.5,
                name=f'lstm_{i}'
            ),
            name=f'bidirectional_{i}'
        ))
    
    # ==========================================
    # GLOBAL MAX POOLING: Capture peak emotions
    # ==========================================
    # Instead of averaging (which dilutes brief emotions), use max pooling to capture
    # peak intensity. If a child is "Surprised" for 1 second and "Neutral" for 9 seconds,
    # max pooling captures that high-intensity moment perfectly.
    # This is critical for detecting micro-expressions and brief emotional spikes.
    model.add(layers.GlobalMaxPooling1D(name='global_max_pooling1d'))
    
    # ==========================================
    # DENSE BLOCK: Final classification
    # ==========================================
    # Increased dropout to fight overfitting (especially important with small dataset)
    # Add L2 regularization to prevent fitting to noise in augmented data
    for i in range(num_dense_layers):
        model.add(layers.Dense(
            dense_units, 
            activation='relu',
            kernel_regularizer=keras.regularizers.l2(0.01),  # L2 regularization to smooth patterns
            name=f'dense_{i}'
        ))
        model.add(layers.BatchNormalization(name=f'batch_normalization_dense_{i}'))
        # Use higher dropout (0.4-0.5) to prevent overfitting on small dataset
        model.add(layers.Dropout(max(dropout_rate, 0.4), name=f'dropout_dense_{i}'))  # At least 0.4 dropout
    
    # Output layer: 9 emotions (multi-label)
    # SIGMOID (not softmax) - allows multiple emotions to be active simultaneously
    model.add(layers.Dense(num_classes, activation='sigmoid', bias_initializer=output_bias, name='output'))
    
    return model

# Keep old function name for backward compatibility
def build_visual_lstm_model(*args, **kwargs):
    """Alias for build_visual_crnn_model for backward compatibility"""
    return build_visual_crnn_model(*args, **kwargs)

def focal_loss(alpha=0.25, gamma=2.0):
    """
    Focal loss for handling class imbalance in multi-label classification
    Helps focus learning on hard examples
    """
    def loss_fn(y_true, y_pred):
        # Clip predictions to avoid log(0)
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1.0 - 1e-7)
        
        # Calculate binary cross-entropy
        bce = -(y_true * tf.math.log(y_pred) + (1 - y_true) * tf.math.log(1 - y_pred))
        
        # Calculate p_t (probability of true class)
        p_t = y_true * y_pred + (1 - y_true) * (1 - y_pred)
        
        # Calculate focal weight
        focal_weight = alpha * tf.pow(1 - p_t, gamma)
        
        # Apply focal weight
        focal_loss = focal_weight * bce
        
        return tf.reduce_mean(focal_loss)
    
    return loss_fn

# ==========================================
# THE FIX: Custom Weighted Loss Layer
# ==========================================
class WeightedBinaryCrossentropy(tf.keras.losses.Loss):
    """
    Weighted Binary Cross-Entropy that only weights positive class terms.
    This prevents zero-prediction collapse by penalizing false negatives more
    without boosting the penalty for negative class predictions.
    
    Args:
      pos_weights: A list of weights, one for each class. 
                   If weight > 1.0, the model is penalized more for missing a positive.
    """
    def __init__(self, pos_weights, from_logits=False, reduction='sum_over_batch_size', name='weighted_binary_crossentropy'):
        super().__init__(reduction=reduction, name=name)
        self.pos_weights = tf.constant(pos_weights, dtype=tf.float32)
        self.from_logits = from_logits

    def call(self, y_true, y_pred):
        if not self.from_logits:
            # Manually convert probs to logits for numerical stability in BCE
            epsilon = 1e-7
            y_pred = tf.clip_by_value(y_pred, epsilon, 1. - epsilon)
            
            # Standard BCE formula split into parts
            # Loss = - pos_weight * y_true * log(y_pred) - (1-y_true) * log(1-y_pred)
            # Only the positive term is weighted!
            
            loss_pos = -1.0 * y_true * tf.math.log(y_pred) * self.pos_weights
            loss_neg = -1.0 * (1.0 - y_true) * tf.math.log(1.0 - y_pred)
            
            # Return per-sample loss (reduction will be handled by parent class)
            return loss_pos + loss_neg
        else:
             # Use tf.nn.weighted_cross_entropy_with_logits if using raw logits
            return tf.nn.weighted_cross_entropy_with_logits(
                labels=y_true, logits=y_pred, pos_weight=self.pos_weights
            )

def compute_class_weights(y_train, valence_idx=8):
    """
    Compute class weights for multi-label classification
    Weights are inversely proportional to class frequency to penalize rare classes more
    
    Returns:
        class_weights: Array of shape (valence_idx,) with weights for each emotion
    """
    class_weights = []
    
    for i in range(valence_idx):
        # Count positive and negative samples for this emotion
        positives = np.sum(y_train[:, i] > 0.5)
        negatives = len(y_train) - positives
        
        if positives == 0:
            # If no positive samples, use a high weight to encourage learning
            weight = 10.0
        else:
            # Weight inversely proportional to positive frequency
            # More weight for rare classes (fewer positives)
            total = positives + negatives
            # Standard formula: weight = total / (num_classes * positives)
            # But we'll use a simpler formula that gives more weight to rare classes
            weight = negatives / (positives + 1e-7)  # Add small epsilon to avoid division by zero
            # Cap the weight to avoid extreme values
            weight = min(weight, 10.0)
        
        class_weights.append(weight)
    
    return np.array(class_weights, dtype=np.float32)

# Custom metrics to track during training
class EmotionBinaryAccuracy(keras.metrics.Metric):
    """Binary accuracy for emotions only (excluding valence)"""
    def __init__(self, name='emotion_binary_accuracy', **kwargs):
        super().__init__(name=name, **kwargs)
        self.true_positives = self.add_weight(name='tp', initializer='zeros')
        self.false_positives = self.add_weight(name='fp', initializer='zeros')
        self.false_negatives = self.add_weight(name='fn', initializer='zeros')
        self.true_negatives = self.add_weight(name='tn', initializer='zeros')
    
    def update_state(self, y_true, y_pred, sample_weight=None):
        valence_idx = 8
        emotion_true = y_true[:, :valence_idx]
        emotion_pred = y_pred[:, :valence_idx]
        emotion_pred_binary = tf.cast(emotion_pred > 0.5, tf.float32)
        
        tp = tf.reduce_sum(emotion_true * emotion_pred_binary)
        fp = tf.reduce_sum((1 - emotion_true) * emotion_pred_binary)
        fn = tf.reduce_sum(emotion_true * (1 - emotion_pred_binary))
        tn = tf.reduce_sum((1 - emotion_true) * (1 - emotion_pred_binary))
        
        self.true_positives.assign_add(tp)
        self.false_positives.assign_add(fp)
        self.false_negatives.assign_add(fn)
        self.true_negatives.assign_add(tn)
    
    def result(self):
        total = self.true_positives + self.false_positives + self.false_negatives + self.true_negatives
        return (self.true_positives + self.true_negatives) / (total + 1e-7)
    
    def reset_state(self):
        self.true_positives.assign(0)
        self.false_positives.assign(0)
        self.false_negatives.assign(0)
        self.true_negatives.assign(0)

class PredictionRate(keras.metrics.Metric):
    """
    Track what percentage of emotion predictions are above threshold (to detect collapse to zeros).
    
    Uses a lower threshold (0.2) instead of 0.5 because:
    - In multi-label problems with rare classes, models often output low-confidence predictions (0.3-0.4)
    - Training data is augmented (noisy), validation data is clean → "confidence gap"
    - Model might be learning but outputting 0.3 for "Happy" instead of 0.8
    - A threshold of 0.5 is too strict and makes the model look like it's collapsed when it's just low-confidence
    """
    def __init__(self, name='prediction_rate', threshold=0.2, **kwargs):
        super().__init__(name=name, **kwargs)
        self.threshold = threshold
        self.positive_count = self.add_weight(name='pos_count', initializer='zeros')
        self.total_count = self.add_weight(name='total_count', initializer='zeros')
    
    def update_state(self, y_true, y_pred, sample_weight=None):
        valence_idx = 8
        emotion_pred = y_pred[:, :valence_idx]
        # Use lower threshold (0.2) to detect low-confidence predictions
        # This helps identify if model is learning but just low-confidence, vs. true zero-collapse
        positive_predictions = tf.reduce_sum(tf.cast(emotion_pred > self.threshold, tf.float32))
        total_predictions = tf.cast(tf.size(emotion_pred), tf.float32)
        
        self.positive_count.assign_add(positive_predictions)
        self.total_count.assign_add(total_predictions)
    
    def result(self):
        return self.positive_count / (self.total_count + 1e-7)
    
    def reset_state(self):
        self.positive_count.assign(0)
        self.total_count.assign(0)

class LossTracker(callbacks.Callback):
    """Track separate emotion and valence losses during training"""
    def __init__(self, X_val=None, y_val=None):
        super().__init__()
        self.X_val = X_val
        self.y_val = y_val
    
    def on_epoch_end(self, epoch, logs=None):
        if logs is None:
            return
        
        # Calculate separate losses on validation set if available
        if self.X_val is not None and self.y_val is not None:
            y_pred = self.model.predict(self.X_val, verbose=0)
            
            valence_idx = 8
            emotion_true = self.y_val[:, :valence_idx]
            emotion_pred = y_pred[:, :valence_idx]
            valence_true = self.y_val[:, valence_idx:valence_idx+1]
            valence_pred = y_pred[:, valence_idx:valence_idx+1]
            
            # Emotion loss - standard BCE for reference
            emotion_bce = tf.keras.losses.binary_crossentropy(emotion_true, emotion_pred)
            emotion_bce_val = float(tf.reduce_mean(emotion_bce).numpy())
            
            # Valence loss
            valence_true_norm = (valence_true - 1.0) / 6.0
            valence_mse_val = float(tf.reduce_mean(tf.square(valence_true_norm - valence_pred)).numpy())
            
            # Note: The actual loss uses weighted BCE, but we show standard BCE for reference
            logs['val_emotion_bce'] = emotion_bce_val  # Standard BCE for reference
            logs['val_valence_mse'] = valence_mse_val
            
            # Prediction rate (what % of emotions are predicted > 0.5)
            pred_rate = float(tf.reduce_mean(tf.cast(emotion_pred > 0.5, tf.float32)).numpy())
            logs['val_prediction_rate'] = pred_rate
            
            print(f"\n  val_emotion_bce: {emotion_bce_val:.4f}, val_valence_mse: {valence_mse_val:.4f}, val_prediction_rate: {pred_rate:.4f}")

def train_model(data, output_dir):
    """Train model with a single reasonable configuration"""
    print("\n" + "=" * 60)
    print("Training Visual LSTM Model")
    print("=" * 60)
    
    X_train = data['X_train']
    y_train = data['y_train']
    X_val = data['X_val']
    y_val = data['y_val']
    X_test = data['X_test']
    y_test = data['y_test']
    
    # Calculate input shape from original data (before augmentation)
    # Sequence length and feature dimensions don't change with augmentation
    input_shape = (X_train.shape[1], X_train.shape[2])
    num_classes = data['num_classes']
    valence_idx = EMOTION_LABELS.index('valence')
    
    # Analyze data (before augmentation)
    analyze_data_characteristics(data)
    
    # --- STEP 1: Data Augmentation (multiply dataset to prevent overfitting) ---
    print("\n" + "=" * 60)
    print("Data Augmentation")
    print("=" * 60)
    X_train_aug, y_train_aug = augment_data(X_train, y_train)
    print(f"Training data: {len(X_train)} → {len(X_train_aug)} samples (4x increase)")
    
    # --- Calculate Bias Initialization (using augmented data) ---
    # We calculate the bias so the model starts by predicting the average probability
    # of each class, rather than 0.5. This stops the "panic" learning of zeros.
    # Recalculate after augmentation since dataset size changed
    print("\nCalculating output bias initialization to prevent zero-collapse (after augmentation)...")
    pos_counts = np.sum(y_train_aug[:, :valence_idx] > 0.5, axis=0)
    total_counts = len(y_train_aug)
    
    # Initial bias = log(pos / neg) for sigmoid
    # This makes the model start with realistic probabilities
    initial_bias = np.log(pos_counts / (total_counts - pos_counts + 1e-7))
    # Append 0.0 bias for valence (regression, no bias needed)
    initial_bias = np.append(initial_bias, 0.0)
    
    print("Initial output biases (prevents zero-collapse):")
    for i, emotion in enumerate(EMOTION_LABELS):
        if i < valence_idx:
            pos_rate = pos_counts[i] / total_counts
            print(f"  {emotion}: bias={initial_bias[i]:.4f} (initial prob={pos_rate:.4f})")
        else:
            print(f"  {emotion}: bias={initial_bias[i]:.4f} (regression)")
    
    # --- Calculate Positive Weights for Loss (using augmented data) ---
    # Weight = neg / pos
    # This balances the loss contribution of 1s and 0s
    # Only positive class terms are weighted (not negative terms)
    # Recalculate after augmentation since dataset size changed
    print("\nCalculating positive class weights for weighted BCE (after augmentation)...")
    neg_counts = total_counts - pos_counts
    pos_weights = neg_counts / (pos_counts + 1e-7)
    
    # Cap weights to prevent explosion and over-prediction
    # Lower cap (5x) to prevent model from panicking and collapsing to zeros
    # If weights are too high (e.g., 12x), the model might find a local minimum
    # where predicting all zeros is safer than risking massive penalties
    # Lower cap makes the loss landscape smoother and prevents zero-collapse
    pos_weights = np.clip(pos_weights, 1.0, 5.0)
    
    print("Positive class weights (penalty for missing a '1'):")
    for i, emotion in enumerate(EMOTION_LABELS[:valence_idx]):
        positives = pos_counts[i]
        print(f"  {emotion}: weight={pos_weights[i]:.2f} (positives: {positives}/{total_counts})")
    
    # Use a single reasonable configuration with increased capacity
    # Increased dropout to fight overfitting (critical with small dataset)
    config = {
        'lstm_units': 128,
        'num_lstm_layers': 2,
        'dense_units': 128,  # Increased for better multi-label learning
        'num_dense_layers': 2,  # Additional layer for better capacity
        'dropout_rate': 0.4  # Increased from 0.3 to 0.4 to prevent overfitting
    }
    
    print(f"\nModel Configuration (CRNN Architecture):")
    print(f"  Architecture: Conv1D → Bidirectional LSTM → GlobalMaxPooling")
    print(f"  Conv1D: 2 layers with MaxPooling (reduces sequence length ~4x)")
    print(f"  Bidirectional LSTM units: {config['lstm_units']}")
    print(f"  LSTM layers: {config['num_lstm_layers']}")
    print(f"  Dense units: {config['dense_units']}")
    print(f"  Dense layers: {config['num_dense_layers']}")
    print(f"  Dropout: {config['dropout_rate']} (increased to prevent overfitting)")
    print(f"  GlobalMaxPooling: Captures peak emotions (not diluted by averaging)")
    
    # Build CRNN model with output bias initialization
    # Using CRNN architecture: Conv1D → Bidirectional LSTM → GlobalMaxPooling
    # This solves the vanishing gradient problem for long sequences
    # GlobalMaxPooling captures peak emotions (not diluted by averaging)
    model = build_visual_crnn_model(
        input_shape=input_shape,
        num_classes=num_classes,
        output_bias=initial_bias,  # Critical: prevents zero-collapse
        **config
    )
    
    # --- Define Custom Combined Loss ---
    # 1. Weighted BCE for Emotions (only weights positive class terms!)
    emotion_loss_fn = WeightedBinaryCrossentropy(pos_weights=pos_weights)
    # 2. MSE for Valence
    valence_loss_fn = keras.losses.MeanSquaredError()

    def final_loss(y_true, y_pred):
        # Split data
        y_true_em = y_true[:, :valence_idx]
        y_pred_em = y_pred[:, :valence_idx]
        
        y_true_val = y_true[:, valence_idx:]
        y_pred_val = y_pred[:, valence_idx:]
        
        # Normalize valence ground truth (1-7 -> 0-1) for MSE stability
        y_true_val_norm = (y_true_val - 1.0) / 6.0
        
        # Calculate separate losses
        loss_em = emotion_loss_fn(y_true_em, y_pred_em)
        loss_val = valence_loss_fn(y_true_val_norm, y_pred_val)
        
        # Combine (Weight valence less as it's easier to learn)
        return loss_em + (0.5 * loss_val)
    
    print(f"\nUsing weighted binary cross-entropy:")
    print(f"  - WeightedBinaryCrossentropy for emotions (weights only positive class terms)")
    print(f"  - MeanSquaredError for valence (regression)")
    print(f"  - NO sample weights (handled internally by loss function)")
    print(f"\nOptimizer settings:")
    print(f"  - Learning rate: 0.0001 (reduced for smoother convergence)")
    print(f"  - Gradient clipping: global_clipnorm=1.0 (prevents exploding gradients)")
    print(f"\nMetrics:")
    print(f"  - PredictionRate uses threshold=0.2 (not 0.5) to detect low-confidence predictions")
    print(f"    This helps distinguish between true zero-collapse vs. low-confidence learning")
    
    model.compile(
        optimizer=keras.optimizers.Adam(
            learning_rate=0.0001,  # Reduced from 0.0005 to 0.0001 for smoother convergence
            global_clipnorm=1.0    # Gradient clipping to prevent exploding gradients (stops loss spikes)
        ),
        loss=final_loss,
        metrics=[
            'mae',
            'binary_accuracy',  # Overall binary accuracy
            EmotionBinaryAccuracy(),  # Emotion-only binary accuracy
            PredictionRate()  # Track if model is collapsing to zeros
        ]
    )
    
    print(f"\nModel architecture:")
    model.summary()
    
    # Callbacks
    callbacks_list = []
    
    # Add loss tracker if validation data exists
    if len(X_val) > 0:
        callbacks_list.append(LossTracker(X_val=X_val, y_val=y_val))
    
    callbacks_list.extend([
        callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),
        callbacks.ModelCheckpoint(
            os.path.join(output_dir, 'best_model.keras'),
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1
        )
    ])
    
    # Train
    print(f"\n{'=' * 60}")
    print("Training Model")
    print(f"{'=' * 60}")
    # Train (NOTE: No sample_weight here! The logic is handled internally by the loss function)
    # Use augmented training data
    history = model.fit(
        X_train_aug, y_train_aug,  # Use augmented data
        validation_data=(X_val, y_val) if len(X_val) > 0 else None,
        epochs=60,  # Increased epochs since we have better initialization
        batch_size=32,
        callbacks=callbacks_list,
        verbose=1
    )
    
    return model, config

def main():
    print("=" * 60)
    print("Visual LSTM Emotion Recognition Training (EmoReact Dataset)")
    print("=" * 60)
    
    # Paths (relative to script location, works in both Windows and WSL)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_base = os.path.join(script_dir, 'EmoReact_V_1.0')
    
    output_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        '..',
        'public',
        'models',
        'visual_emotion_model'
    )
    os.makedirs(output_dir, exist_ok=True)
    
    # Prepare data
    # Enable pose reduction: keep only upper body landmarks (face + shoulders + arms + upper torso) and drop z-coordinate
    # This reduces input from 154 to 89 features (52 blendshapes + 3 head pose + 34 upper body pose)
    # Upper body landmarks: 17 landmarks (face + shoulders + arms + upper torso) - most relevant for emotion recognition
    # This reduction is applied BY DEFAULT when training
    reduce_pose_dim = True  # Drop z-coordinate (keep only x,y) - DEFAULT: True
    upper_body_only = True  # Keep only upper body landmarks - DEFAULT: True
    print("\nLoading and preparing data...")
    data = prepare_training_data(dataset_base, reduce_pose_dim=reduce_pose_dim, upper_body_only=upper_body_only)
    
    # Train model
    model, best_config = train_model(data, output_dir)
    
    # Final evaluation on test set
    print("\n" + "=" * 60)
    print("Final Evaluation")
    print("=" * 60)
    
    X_test = data['X_test']
    y_test = data['y_test']
    
    if len(X_test) > 0:
        test_loss = model.evaluate(X_test, y_test, verbose=1)
        print(f"\nTest Loss: {test_loss[0]:.4f}")
    
    # Predictions
    y_pred = model.predict(X_test, verbose=0)
    
    valence_idx = EMOTION_LABELS.index('valence')
    
    # Debug: Check label ranges
    print(f"\nLabel Statistics (Test Set):")
    print(f"  Test set size: {len(y_test)}")
    for i, emotion in enumerate(EMOTION_LABELS):
        if emotion == 'valence':
            print(f"  {emotion}: min={np.min(y_test[:, i]):.2f}, max={np.max(y_test[:, i]):.2f}, mean={np.mean(y_test[:, i]):.2f}")
        else:
            print(f"  {emotion}: min={np.min(y_test[:, i]):.2f}, max={np.max(y_test[:, i]):.2f}, mean={np.mean(y_test[:, i]):.2f}, >0.5={np.sum(y_test[:, i] > 0.5)}/{len(y_test)}")
        
        # Convert predictions to binary for emotions
        # Emotions: threshold at 0.5 (sigmoid output) -> binary
        y_pred_binary = (y_pred[:, :valence_idx] > 0.5).astype(int)
        
        # Convert ground truth to binary for emotions (threshold at 0.5 for 0-1 scale)
        y_test_binary = (y_test[:, :valence_idx] > 0.5).astype(int)
        
        # Check if we have any positive samples
        total_positive = np.sum(y_test_binary)
        print(f"\nTotal positive emotion samples in test set: {total_positive}/{len(y_test) * valence_idx}")
        
        if total_positive > 0:
            # Classification report for emotions (excluding valence)
            print("\nClassification Report (Emotions, excluding Valence):")
            print(classification_report(
                y_test_binary,
                y_pred_binary,
                target_names=EMOTION_LABELS[:valence_idx],
                zero_division=0
            ))
        else:
            print("\nWarning: No positive emotion samples in test set (all labels <= 0.5).")
            print("This suggests the test set labels might be in a different format or scale.")
            print("\nPrediction Statistics (sigmoid outputs):")
            for i, emotion in enumerate(EMOTION_LABELS[:valence_idx]):
                print(f"  {emotion}: min={np.min(y_pred[:, i]):.3f}, max={np.max(y_pred[:, i]):.3f}, mean={np.mean(y_pred[:, i]):.3f}, >0.5={np.sum(y_pred[:, i] > 0.5)}/{len(y_test)}")
        
        # Valence: convert from 0-1 back to 1-7 and calculate MAE
        y_pred_valence = y_pred[:, valence_idx] * 6.0 + 1.0
        valence_mae = np.mean(np.abs(y_test[:, valence_idx] - y_pred_valence))
        print(f"\nValence MAE: {valence_mae:.4f}")
        print(f"Valence predictions: min={np.min(y_pred_valence):.2f}, max={np.max(y_pred_valence):.2f}, mean={np.mean(y_pred_valence):.2f}")
        print(f"Valence ground truth: min={np.min(y_test[:, valence_idx]):.2f}, max={np.max(y_test[:, valence_idx]):.2f}, mean={np.mean(y_test[:, valence_idx]):.2f}")
    
    # Save model
    print(f"\nSaving model to {output_dir}...")
    
    # Save in both formats
    model.save(os.path.join(output_dir, 'visual_emotion_model.keras'))
    model.save(os.path.join(output_dir, 'visual_emotion_model.h5'))
    
    # Save architecture config
    with open(os.path.join(output_dir, 'architecture_config.json'), 'w') as f:
        json.dump(best_config, f, indent=2)
    
    # Save emotion labels
    with open(os.path.join(output_dir, 'emotion_labels.json'), 'w') as f:
        json.dump(EMOTION_LABELS, f, indent=2)
    
    # Convert to TensorFlow.js
    print("Converting to TensorFlow.js...")
    # Ensure model is in inference mode (not training) before conversion
    # This ensures BatchNormalization layers use the correct weights
    model.trainable = False
    
    # Remove L2 regularizers (TensorFlow.js doesn't support them)
    print("Removing L2 regularizers for TensorFlow.js compatibility...")
    for layer in model.layers:
        if hasattr(layer, 'kernel_regularizer') and layer.kernel_regularizer is not None:
            layer.kernel_regularizer = None
        if hasattr(layer, 'bias_regularizer') and layer.bias_regularizer is not None:
            layer.bias_regularizer = None
        if hasattr(layer, 'activity_regularizer') and layer.activity_regularizer is not None:
            layer.activity_regularizer = None
    
    # Recompile to ensure all layers are properly set up
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss='binary_crossentropy',
        metrics=['mae', 'binary_accuracy']
    )
    
    # Save the model first to ensure all weights are properly saved
    keras_model_path = os.path.join(output_dir, 'model_for_tfjs.keras')
    print("Saving model to Keras format before conversion...")
    model.save(keras_model_path)
    print("Model saved.")
    
    # Convert to TensorFlow.js from saved Keras file (more reliable for weight handling)
    print("Converting to TensorFlow.js from saved Keras file...")
    tfjs_dir = os.path.join(output_dir, 'tfjs_model')
    
    # Remove old tfjs_model directory if it exists
    if os.path.exists(tfjs_dir):
        import shutil
        shutil.rmtree(tfjs_dir)
    
    # Load the model from the saved file to ensure all weights are properly loaded
    # Then convert the model object to TensorFlow.js
    print("  Loading model from saved Keras file...")
    print(f"  Source: {keras_model_path}")
    model_for_tfjs = keras.models.load_model(keras_model_path, compile=False)
    print("  Model loaded successfully")
    
    # Convert the model to TensorFlow.js
    print("  Converting to TensorFlow.js...")
    print(f"  Target: {tfjs_dir}")
    # Import tensorflowjs here (lazy import to avoid dependency issues at module load time)
    import tensorflowjs as tfjs
    tfjs.converters.save_keras_model(
        model_for_tfjs,
        tfjs_dir
    )
    print("  TensorFlow.js model created successfully")
    
    # Fix model.json: TensorFlow.js doesn't support batch_shape, needs inputShape
    print("Fixing TensorFlow.js model.json (converting batch_shape to inputShape)...")
    model_json_path = os.path.join(output_dir, 'tfjs_model', 'model.json')
    if os.path.exists(model_json_path):
        with open(model_json_path, 'r') as f:
            data = json.load(f)
        
        # Fix InputLayer config
        input_layer = data['modelTopology']['model_config']['config']['layers'][0]
        if 'batch_shape' in input_layer['config']:
            batch_shape = input_layer['config']['batch_shape']
            input_shape = batch_shape[1:] if batch_shape[0] is None else batch_shape[1:]
            input_layer['config']['inputShape'] = input_shape
            del input_layer['config']['batch_shape']
            with open(model_json_path, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"  Fixed: converted batch_shape to inputShape {input_shape}")
    
    print("\nTraining complete!")
    print(f"Model saved to: {output_dir}")

if __name__ == '__main__':
    main()
