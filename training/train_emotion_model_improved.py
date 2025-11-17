"""
Improved emotion recognition model training
- Better architecture with batch normalization
- Weighted loss for imbalanced classes
- Training callbacks (early stopping, learning rate scheduling)
- Improved label generation
- Better evaluation metrics
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, mean_squared_error, mean_absolute_error
)
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
import tensorflowjs as tfjs
import json
import matplotlib.pyplot as plt
import seaborn as sns

# Emotion labels
EMOTIONS = ['anger', 'sadness', 'anxiety', 'fear', 'happiness', 'guilt']
AU_COLUMNS = ['AU01_r', 'AU02_r', 'AU04_r', 'AU05_r', 'AU06_r', 'AU07_r', 
              'AU12_r', 'AU14_r', 'AU15_r', 'AU17_r', 'AU20_r', 'AU25_r']

def load_dataset(aus_dir, valences_dir):
    """Load all AU and valence CSV files"""
    data = []
    
    au_files = [f for f in os.listdir(aus_dir) if f.endswith('_aus.csv')]
    
    for au_file in au_files:
        prefix = au_file.replace('_aus.csv', '')
        valence_file = prefix + '_valences.csv'
        
        au_path = os.path.join(aus_dir, au_file)
        valence_path = os.path.join(valences_dir, valence_file)
        
        if not os.path.exists(valence_path):
            print(f"Warning: No matching valence file for {au_file}")
            continue
        
        au_df = pd.read_csv(au_path)
        valence_df = pd.read_csv(valence_path)
        merged = pd.merge(au_df, valence_df, on='Image', how='inner')
        valence_label = prefix.split('_')[-1]
        
        data.append({
            'prefix': prefix,
            'valence_label': valence_label,
            'data': merged
        })
    
    return data

def map_aus_to_emotions(au_values, valence_label):
    """
    Improved emotion mapping with less conservative normalization
    Returns a 6-element array with probabilities (0-1) for each emotion
    """
    aus = {
        'AU01': au_values.get('AU01_r', 0),
        'AU02': au_values.get('AU02_r', 0),
        'AU04': au_values.get('AU04_r', 0),
        'AU05': au_values.get('AU05_r', 0),
        'AU06': au_values.get('AU06_r', 0),
        'AU07': au_values.get('AU07_r', 0),
        'AU12': au_values.get('AU12_r', 0),
        'AU14': au_values.get('AU14_r', 0),
        'AU15': au_values.get('AU15_r', 0),
        'AU17': au_values.get('AU17_r', 0),
        'AU20': au_values.get('AU20_r', 0),
        'AU25': au_values.get('AU25_r', 0),
    }
    
    emotion_scores = {
        'anger': 0.0,
        'sadness': 0.0,
        'anxiety': 0.0,
        'fear': 0.0,
        'happiness': 0.0,
        'guilt': 0.0,
    }
    
    # Improved normalization - less conservative to produce higher probabilities
    # Happiness: High AU06 + AU12 (positive valence)
    if valence_label == 'P':
        happiness_score = (aus['AU06'] + aus['AU12']) / 2.0
        # Less conservative: divide by 1.5 instead of 2.5
        emotion_scores['happiness'] = min(1.0, happiness_score / 1.5)
    
    # Anger: High AU04 + AU05 + AU07 (negative valence)
    if valence_label == 'N':
        anger_score = (aus['AU04'] + aus['AU05'] + aus['AU07']) / 3.0
        emotion_scores['anger'] = min(1.0, anger_score / 1.2)  # Less conservative
    
    # Sadness: High AU01 + AU04 + AU15 (negative valence)
    if valence_label == 'N':
        sadness_score = (aus['AU01'] + aus['AU04'] + aus['AU15']) / 3.0
        emotion_scores['sadness'] = min(1.0, sadness_score / 1.2)  # Less conservative
    
    # Fear: High AU01 + AU02 + AU04 + AU05 + AU20 (negative valence)
    if valence_label == 'N':
        fear_score = (aus['AU01'] + aus['AU02'] + aus['AU04'] + aus['AU05'] + aus['AU20']) / 5.0
        emotion_scores['fear'] = min(1.0, fear_score / 1.0)  # Less conservative
    
    # Anxiety: Similar to fear but with AU17 (negative valence)
    if valence_label == 'N':
        anxiety_score = (aus['AU01'] + aus['AU02'] + aus['AU04'] + aus['AU05'] + aus['AU17']) / 5.0
        emotion_scores['anxiety'] = min(1.0, anxiety_score / 1.0)  # Less conservative
    
    # Guilt: AU01 + AU04 + AU15 + AU17 (sadness-like, negative valence)
    if valence_label == 'N':
        guilt_score = (aus['AU01'] + aus['AU04'] + aus['AU15'] + aus['AU17']) / 4.0
        emotion_scores['guilt'] = min(1.0, guilt_score / 1.2)  # Less conservative
    
    return np.array([emotion_scores[e] for e in EMOTIONS])

def prepare_training_data(data):
    """Prepare data for training"""
    X = []
    y = []
    
    for item in data:
        df = item['data']
        valence_label = item['valence_label']
        
        for _, row in df.iterrows():
            au_values = row[AU_COLUMNS].to_dict()
            emotion_probs = map_aus_to_emotions(au_values, valence_label)
            au_features = [row[au] for au in AU_COLUMNS]
            
            X.append(au_features)
            y.append(emotion_probs)
    
    return np.array(X), np.array(y)

def calculate_class_weights(y):
    """Calculate class weights for imbalanced data"""
    # Count positive samples per emotion
    pos_counts = np.sum(y > 0.1, axis=0)  # Threshold at 0.1
    total = len(y)
    neg_counts = total - pos_counts
    
    # Calculate weights to balance classes
    weights = {}
    for i, emotion in enumerate(EMOTIONS):
        if pos_counts[i] > 0:
            # Weight inversely proportional to frequency
            weight = total / (2.0 * pos_counts[i])
            weights[i] = max(1.0, min(10.0, weight))  # Cap between 1 and 10
        else:
            weights[i] = 1.0
    
    return weights

def build_improved_model(input_dim, num_emotions, class_weights=None):
    """Build improved model with batch normalization and better architecture"""
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        
        # First block with batch norm
        layers.Dense(256, use_bias=False),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Dropout(0.4),
        
        # Second block
        layers.Dense(128, use_bias=False),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Dropout(0.3),
        
        # Third block
        layers.Dense(64, use_bias=False),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Dropout(0.2),
        
        # Output layer
        layers.Dense(num_emotions, activation='sigmoid')
    ])
    
    # Use weighted binary crossentropy if class weights provided
    if class_weights:
        # Create weight tensor with shape [1, num_emotions] for proper broadcasting
        weight_array = np.array([class_weights.get(i, 1.0) for i in range(num_emotions)], dtype=np.float32)
        weight_tensor = tf.constant(weight_array, shape=[1, num_emotions], dtype=tf.float32)
        
        def weighted_binary_crossentropy(y_true, y_pred):
            # Manually compute binary crossentropy per sample and emotion
            # y_true and y_pred have shape [batch_size, num_emotions]
            epsilon = tf.keras.backend.epsilon()
            y_pred = tf.clip_by_value(y_pred, epsilon, 1 - epsilon)
            
            # Binary crossentropy formula: -(y_true * log(y_pred) + (1 - y_true) * log(1 - y_pred))
            bce = -(y_true * tf.math.log(y_pred) + (1 - y_true) * tf.math.log(1 - y_pred))
            # bce has shape [batch_size, num_emotions]
            
            # Apply weights: multiply each emotion's loss by its weight
            # Broadcasting: [batch_size, num_emotions] * [1, num_emotions] -> [batch_size, num_emotions]
            weighted_bce = bce * weight_tensor
            # Return mean across all samples and emotions
            return tf.reduce_mean(weighted_bce)
        
        loss_fn = weighted_binary_crossentropy
    else:
        loss_fn = 'binary_crossentropy'
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss=loss_fn,
        metrics=['accuracy', 'mse']
    )
    
    return model

def calculate_metrics(y_true, y_pred, threshold=0.5):
    """Calculate comprehensive metrics"""
    y_pred_binary = (y_pred >= threshold).astype(int)
    y_true_binary = (y_true >= threshold).astype(int)
    
    metrics = {}
    
    # Overall metrics
    metrics['overall'] = {
        'accuracy': accuracy_score(y_true_binary.flatten(), y_pred_binary.flatten()),
        'precision': precision_score(y_true_binary, y_pred_binary, average='micro', zero_division=0),
        'recall': recall_score(y_true_binary, y_pred_binary, average='micro', zero_division=0),
        'f1_score': f1_score(y_true_binary, y_pred_binary, average='micro', zero_division=0),
        'mse': mean_squared_error(y_true, y_pred),
        'mae': mean_absolute_error(y_true, y_pred),
    }
    
    # Macro-averaged metrics
    metrics['macro'] = {
        'precision': precision_score(y_true_binary, y_pred_binary, average='macro', zero_division=0),
        'recall': recall_score(y_true_binary, y_pred_binary, average='macro', zero_division=0),
        'f1_score': f1_score(y_true_binary, y_pred_binary, average='macro', zero_division=0),
    }
    
    # Per-emotion metrics
    metrics['per_emotion'] = {}
    for i, emotion in enumerate(EMOTIONS):
        metrics['per_emotion'][emotion] = {
            'precision': precision_score(y_true_binary[:, i], y_pred_binary[:, i], zero_division=0),
            'recall': recall_score(y_true_binary[:, i], y_pred_binary[:, i], zero_division=0),
            'f1_score': f1_score(y_true_binary[:, i], y_pred_binary[:, i], zero_division=0),
            'mse': mean_squared_error(y_true[:, i], y_pred[:, i]),
            'mae': mean_absolute_error(y_true[:, i], y_pred[:, i]),
            'mean_prediction': float(np.mean(y_pred[:, i])),
            'mean_true': float(np.mean(y_true[:, i])),
        }
    
    return metrics

def plot_training_history(history):
    """Plot training history"""
    fig, axes = plt.subplots(1, 3, figsize=(15, 4))
    
    axes[0].plot(history.history['loss'], label='Training Loss')
    axes[0].plot(history.history['val_loss'], label='Validation Loss')
    axes[0].set_title('Model Loss')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].legend()
    axes[0].grid(True)
    
    axes[1].plot(history.history['accuracy'], label='Training Accuracy')
    axes[1].plot(history.history['val_accuracy'], label='Validation Accuracy')
    axes[1].set_title('Model Accuracy')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy')
    axes[1].legend()
    axes[1].grid(True)
    
    axes[2].plot(history.history['mse'], label='Training MSE')
    axes[2].plot(history.history['val_mse'], label='Validation MSE')
    axes[2].set_title('Model MSE')
    axes[2].set_xlabel('Epoch')
    axes[2].set_ylabel('MSE')
    axes[2].legend()
    axes[2].grid(True)
    
    plt.tight_layout()
    plt.show()

def plot_confusion_matrices(y_true, y_pred, threshold=0.5):
    """Plot confusion matrices for each emotion"""
    y_pred_binary = (y_pred >= threshold).astype(int)
    y_true_binary = (y_true >= threshold).astype(int)
    
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    axes = axes.flatten()
    labels = [0, 1]
    
    for i, emotion in enumerate(EMOTIONS):
        cm = confusion_matrix(y_true_binary[:, i], y_pred_binary[:, i], labels=labels)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[i], 
                   xticklabels=['Low', 'High'], yticklabels=['Low', 'High'], vmin=0)
        axes[i].set_title(f'{emotion.capitalize()} Confusion Matrix')
        axes[i].set_ylabel('True Label')
        axes[i].set_xlabel('Predicted Label')
    
    plt.tight_layout()
    plt.show()

def main():
    print("=" * 60)
    print("Improved Emotion Recognition Model Training")
    print("=" * 60)
    
    # Paths - adjust for your Colab setup
    aus_dir = '/content/expression_dataset/AUs'
    valences_dir = '/content/expression_dataset/Valences'
    output_dir = '/content/emotion_model'
    
    if not os.path.exists(aus_dir):
        print(f"\nERROR: AUs directory not found: {aus_dir}")
        print("Please update the paths in the script.")
        return
    
    print("\n" + "=" * 60)
    print("Step 1: Loading dataset...")
    print("=" * 60)
    data = load_dataset(aus_dir, valences_dir)
    print(f"✓ Loaded {len(data)} samples")
    
    print("\n" + "=" * 60)
    print("Step 2: Preparing training data...")
    print("=" * 60)
    X, y = prepare_training_data(data)
    print(f"✓ X shape: {X.shape}, y shape: {y.shape}")
    print(f"✓ Label range: min={y.min():.3f}, max={y.max():.3f}, mean={y.mean():.3f}")
    print(f"✓ Label distribution per emotion:")
    for i, emotion in enumerate(EMOTIONS):
        non_zero = np.sum(y[:, i] > 0.1)
        print(f"  {emotion}: {non_zero}/{len(y)} samples with value > 0.1, mean={y[:, i].mean():.3f}")
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )
    
    print(f"\n✓ Training set: {X_train.shape}")
    print(f"✓ Test set: {X_test.shape}")
    
    # Calculate class weights
    print("\n" + "=" * 60)
    print("Step 3: Calculating class weights...")
    print("=" * 60)
    class_weights = calculate_class_weights(y_train)
    print("Class weights:")
    for i, emotion in enumerate(EMOTIONS):
        print(f"  {emotion}: {class_weights.get(i, 1.0):.2f}")
    
    print("\n" + "=" * 60)
    print("Step 4: Building improved model...")
    print("=" * 60)
    model = build_improved_model(X_train.shape[1], len(EMOTIONS), class_weights)
    print("\nModel Architecture:")
    model.summary()
    
    print("\n" + "=" * 60)
    print("Step 5: Training model with callbacks...")
    print("=" * 60)
    
    # Training callbacks
    callbacks_list = [
        callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1
        ),
        callbacks.ModelCheckpoint(
            os.path.join(output_dir, 'best_model.h5'),
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        )
    ]
    
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=100,  # More epochs, but early stopping will prevent overfitting
        validation_data=(X_test, y_test),
        callbacks=callbacks_list,
        verbose=1
    )
    
    # Load best model
    if os.path.exists(os.path.join(output_dir, 'best_model.h5')):
        model.load_weights(os.path.join(output_dir, 'best_model.h5'))
        print("\n✓ Loaded best model weights")
    
    plot_training_history(history)
    
    print("\n" + "=" * 60)
    print("Step 6: Evaluating model...")
    print("=" * 60)
    
    y_train_pred = model.predict(X_train, verbose=0)
    y_test_pred = model.predict(X_test, verbose=0)
    
    train_metrics = calculate_metrics(y_train, y_train_pred)
    test_metrics = calculate_metrics(y_test, y_test_pred)
    
    print("\n" + "-" * 60)
    print("OVERALL METRICS (Test Set)")
    print("-" * 60)
    print(f"Accuracy:  {test_metrics['overall']['accuracy']:.4f}")
    print(f"Precision: {test_metrics['overall']['precision']:.4f}")
    print(f"Recall:    {test_metrics['overall']['recall']:.4f}")
    print(f"F1-Score:  {test_metrics['overall']['f1_score']:.4f}")
    print(f"MSE:       {test_metrics['overall']['mse']:.4f}")
    print(f"MAE:       {test_metrics['overall']['mae']:.4f}")
    
    print("\n" + "-" * 60)
    print("PER-EMOTION METRICS (Test Set)")
    print("-" * 60)
    for emotion in EMOTIONS:
        m = test_metrics['per_emotion'][emotion]
        print(f"\n{emotion.capitalize()}:")
        print(f"  Precision: {m['precision']:.4f}")
        print(f"  Recall:    {m['recall']:.4f}")
        print(f"  F1-Score:  {m['f1_score']:.4f}")
        print(f"  MSE:       {m['mse']:.4f}")
        print(f"  MAE:       {m['mae']:.4f}")
        print(f"  Mean Pred: {m['mean_prediction']:.4f} (True: {m['mean_true']:.4f})")
    
    plot_confusion_matrices(y_test, y_test_pred)
    
    print("\n" + "=" * 60)
    print("Step 7: Saving model...")
    print("=" * 60)
    os.makedirs(output_dir, exist_ok=True)
    
    model.save(os.path.join(output_dir, 'model.h5'))
    print(f"✓ Saved model: {os.path.join(output_dir, 'model.h5')}")
    
    tfjs.converters.save_keras_model(model, output_dir)
    print(f"✓ Saved TensorFlow.js model")
    
    import pickle
    with open(os.path.join(output_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
    
    scaler_json = {
        'mean': scaler.mean_.tolist(),
        'scale': scaler.scale_.tolist()
    }
    with open(os.path.join(output_dir, 'scaler.json'), 'w') as f:
        json.dump(scaler_json, f, indent=2)
    
    with open(os.path.join(output_dir, 'emotions.txt'), 'w') as f:
        f.write('\n'.join(EMOTIONS))
    
    metrics_to_save = {
        'train': {
            'overall': {k: float(v) for k, v in train_metrics['overall'].items()},
            'macro': {k: float(v) for k, v in train_metrics['macro'].items()},
            'per_emotion': {
                emotion: {k: float(v) for k, v in metrics.items()}
                for emotion, metrics in train_metrics['per_emotion'].items()
            }
        },
        'test': {
            'overall': {k: float(v) for k, v in test_metrics['overall'].items()},
            'macro': {k: float(v) for k, v in test_metrics['macro'].items()},
            'per_emotion': {
                emotion: {k: float(v) for k, v in metrics.items()}
                for emotion, metrics in test_metrics['per_emotion'].items()
            }
        }
    }
    with open(os.path.join(output_dir, 'metrics.json'), 'w') as f:
        json.dump(metrics_to_save, f, indent=2)
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()

