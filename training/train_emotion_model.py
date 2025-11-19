"""
Train emotion recognition model from expression_dataset
Maps AUs and valence to 6 emotions: anger, sadness, anxiety, fear, happiness, guilt
"""

import os
import warnings
# Suppress NumPy warnings on Windows (MINGW-W64 experimental build warnings)
warnings.filterwarnings('ignore', category=RuntimeWarning, module='numpy')
warnings.filterwarnings('ignore', message='.*Numpy built with MINGW-W64.*')
warnings.filterwarnings('ignore', message='.*CRASHES ARE TO BE EXPECTED.*')

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import tensorflowjs as tfjs

# Emotion labels
EMOTIONS = ['anger', 'sadness', 'anxiety', 'fear', 'happiness', 'guilt']
AU_COLUMNS = ['AU01_r', 'AU02_r', 'AU04_r', 'AU05_r', 'AU06_r', 'AU07_r', 
              'AU12_r', 'AU14_r', 'AU15_r', 'AU17_r', 'AU20_r', 'AU25_r']

def load_dataset(aus_dir, valences_dir):
    """Load all AU and valence CSV files"""
    data = []
    
    # Get all AU files
    au_files = [f for f in os.listdir(aus_dir) if f.endswith('_aus.csv')]
    
    for au_file in au_files:
        # Extract prefix (e.g., E01_CT_P from E01_CT_P_aus.csv)
        prefix = au_file.replace('_aus.csv', '')
        valence_file = prefix + '_valences.csv'
        
        au_path = os.path.join(aus_dir, au_file)
        valence_path = os.path.join(valences_dir, valence_file)
        
        if not os.path.exists(valence_path):
            print(f"Warning: No matching valence file for {au_file}")
            continue
        
        # Load AU data
        au_df = pd.read_csv(au_path)
        # Load valence data
        valence_df = pd.read_csv(valence_path)
        
        # Merge on Image column
        merged = pd.merge(au_df, valence_df, on='Image', how='inner')
        
        # Extract valence label from filename (P, N, M)
        valence_label = prefix.split('_')[-1]  # P, N, or M
        
        data.append({
            'prefix': prefix,
            'valence_label': valence_label,
            'data': merged
        })
    
    return data

def map_aus_to_emotions(au_values, valence_label):
    """
    Map AUs and valence to emotion probabilities using FACS rules
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
    
    # Initialize emotion scores
    emotion_scores = {
        'anger': 0.0,
        'sadness': 0.0,
        'anxiety': 0.0,
        'fear': 0.0,
        'happiness': 0.0,
        'guilt': 0.0,
    }
    
    # Emotion mapping based on research table (Table 1 from [4])
    # Map AUs to emotions using weighted combinations based on research values
    
    # Happiness (happy): AU6: 0.51, AU9: 1.0, AU12: 0, AU25: 1.0
    # We use AU6 and AU12 (AU9 not in our set, AU25 available)
    # Weighted: AU6*0.51 + AU12*0.0 + AU25*1.0, normalized by max expected (1.0)
    happiness_score = (aus['AU06'] * 0.51 + aus['AU12'] * 0.0 + aus['AU25'] * 1.0) / 1.51
    emotion_scores['happiness'] = min(1.0, happiness_score)
    
    # Anger (angry): AU4: 1.4, AU5: 0.8, AU6: 0.21, AU17: 0.67, AU20: 0.5
    # Weighted combination normalized by max (1.4)
    anger_score = (aus['AU04'] * 1.4 + aus['AU05'] * 0.8 + aus['AU06'] * 0.21 + 
                   aus['AU17'] * 0.67 + aus['AU20'] * 0.5) / 3.58
    emotion_scores['anger'] = min(1.0, anger_score)
    
    # Sadness: AU1: 0.6, AU4: 1.0, AU6: 0.5, AU9: 0.03, AU15: 0.67
    # Weighted combination normalized by max (1.0)
    sadness_score = (aus['AU01'] * 0.6 + aus['AU04'] * 1.0 + aus['AU06'] * 0.5 + 
                     aus['AU15'] * 0.67) / 2.77
    emotion_scores['sadness'] = min(1.0, sadness_score)
    
    # Fear: AU1: 1.0, AU2: 0.57, AU4: 1.0, AU5: 0.63, AU25: 1.0, AU26: 0.33
    # Weighted combination (AU26 not in our set)
    fear_score = (aus['AU01'] * 1.0 + aus['AU02'] * 0.57 + aus['AU04'] * 1.0 + 
                  aus['AU05'] * 0.63 + aus['AU25'] * 1.0) / 4.2
    emotion_scores['fear'] = min(1.0, fear_score)
    
    # Anxiety: Similar to fear but with elements of sadness and anger
    # Combines fear-like AUs (AU1, AU2, AU4, AU5) with sadness elements (AU15, AU17)
    anxiety_score = (aus['AU01'] * 1.0 + aus['AU02'] * 0.57 + aus['AU04'] * 0.7 + 
                     aus['AU05'] * 0.63 + aus['AU15'] * 0.67 + aus['AU17'] * 0.5) / 4.07
    emotion_scores['anxiety'] = min(1.0, anxiety_score)
    
    # Guilt: Combines sadness (AU1, AU4, AU15) with anger elements (AU17)
    # Similar to sadness but with guilt-specific markers
    guilt_score = (aus['AU01'] * 0.6 + aus['AU04'] * 0.8 + aus['AU15'] * 0.67 + 
                   aus['AU17'] * 0.67) / 2.74
    emotion_scores['guilt'] = min(1.0, guilt_score)
    
    # Apply valence-based weighting to reduce sparsity while keeping research-based values
    if valence_label == 'P':
        # Positive: emphasize happiness, reduce negative emotions
        emotion_scores['happiness'] = min(1.0, emotion_scores['happiness'] * 1.3)
        emotion_scores['anger'] = emotion_scores['anger'] * 0.4
        emotion_scores['sadness'] = emotion_scores['sadness'] * 0.4
        emotion_scores['fear'] = emotion_scores['fear'] * 0.4
        emotion_scores['anxiety'] = emotion_scores['anxiety'] * 0.4
        emotion_scores['guilt'] = emotion_scores['guilt'] * 0.4
    elif valence_label == 'N':
        # Negative: emphasize negative emotions, reduce happiness
        emotion_scores['happiness'] = emotion_scores['happiness'] * 0.4
        emotion_scores['anger'] = min(1.0, emotion_scores['anger'] * 1.3)
        emotion_scores['sadness'] = min(1.0, emotion_scores['sadness'] * 1.3)
        emotion_scores['fear'] = min(1.0, emotion_scores['fear'] * 1.3)
        emotion_scores['anxiety'] = min(1.0, emotion_scores['anxiety'] * 1.3)
        emotion_scores['guilt'] = min(1.0, emotion_scores['guilt'] * 1.3)
    # For 'M' (Mixed/Neutral): keep all emotions as calculated (no special weighting)
    # This allows mixed emotions to be present based on actual AU values
    
    # Clamp all values to [0, 1]
    for emotion in emotion_scores:
        emotion_scores[emotion] = max(0.0, min(1.0, emotion_scores[emotion]))
    
    # Convert to array in emotion order
    return np.array([emotion_scores[e] for e in EMOTIONS])

def prepare_training_data(data):
    """Prepare data for training"""
    X = []
    y = []
    
    for item in data:
        df = item['data']
        valence_label = item['valence_label']
        
        for _, row in df.iterrows():
            # Extract AU values
            au_values = row[AU_COLUMNS].to_dict()
            
            # Get emotion labels
            emotion_probs = map_aus_to_emotions(au_values, valence_label)
            
            # Use AU values as features
            au_features = [row[au] for au in AU_COLUMNS]
            
            X.append(au_features)
            y.append(emotion_probs)
    
    return np.array(X), np.array(y)

def build_lstm_model(input_shape, num_emotions):
    """Build LSTM model for time-series emotion recognition"""
    model = keras.Sequential([
        layers.Input(shape=input_shape),
        layers.LSTM(64, return_sequences=True),
        layers.Dropout(0.3),
        layers.LSTM(32, return_sequences=False),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.Dense(num_emotions, activation='sigmoid')  # Multi-label output
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', 'mse']
    )
    
    return model

def build_frame_model(input_dim, num_emotions):
    """Build frame-based model (for single frame prediction)"""
    # Use Sequential API - TensorFlow.js 3.x handles Sequential models better
    # Sequential models don't have complex inbound_nodes that cause parsing issues
    # Improved architecture with more capacity for better accuracy
    model = keras.Sequential([
        layers.Dense(256, activation='relu', input_shape=(input_dim,)),
        layers.Dropout(0.4),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_emotions, activation='sigmoid')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', 'mse']
    )
    
    return model

def create_sequences(X, y, sequence_length=10):
    """Create sequences for LSTM training"""
    X_seq = []
    y_seq = []
    
    for i in range(len(X) - sequence_length + 1):
        X_seq.append(X[i:i+sequence_length])
        y_seq.append(y[i+sequence_length-1])  # Predict last frame
    
    return np.array(X_seq), np.array(y_seq)

def main():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    aus_dir = os.path.join(project_root, 'app', 'expression_dataset', 'AUs')
    valences_dir = os.path.join(project_root, 'app', 'expression_dataset', 'Valences')
    output_dir = os.path.join(project_root, 'public', 'models', 'emotion_model')
    
    print("Loading dataset...")
    data = load_dataset(aus_dir, valences_dir)
    print(f"Loaded {len(data)} samples")
    
    print("Preparing training data...")
    X, y = prepare_training_data(data)
    print(f"X shape: {X.shape}, y shape: {y.shape}")
    print(f"\nLabel statistics:")
    print(f"  Min: {y.min():.4f}, Max: {y.max():.4f}, Mean: {y.mean():.4f}")
    print(f"  Non-zero labels: {np.sum(y > 0.1) / y.size * 100:.1f}%")
    for i, emotion in enumerate(EMOTIONS):
        non_zero = np.sum(y[:, i] > 0.1)
        mean_val = y[:, i].mean()
        max_val = y[:, i].max()
        print(f"  {emotion}: {non_zero}/{len(y)} samples > 0.1, mean={mean_val:.4f}, max={max_val:.4f}")
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )
    
    print(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
    
    # Build frame-based model (simpler for initial implementation)
    print("Building model...")
    model = build_frame_model(X_train.shape[1], len(EMOTIONS))
    model.summary()
    
    # Train model with callbacks for better training
    print("Training model...")
    callbacks_list = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1
        )
    ]
    
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=100,  # More epochs with early stopping
        validation_data=(X_test, y_test),
        callbacks=callbacks_list,
        verbose=1
    )
    
    # Evaluate
    print("Evaluating model...")
    test_loss, test_acc, test_mse = model.evaluate(X_test, y_test, verbose=0)
    print(f"Test Loss: {test_loss:.4f}, Test Accuracy: {test_acc:.4f}, Test MSE: {test_mse:.4f}")
    
    # Save model
    os.makedirs(output_dir, exist_ok=True)
    
    # Save TensorFlow model
    model.save(os.path.join(output_dir, 'model.h5'))
    
    # Convert to TensorFlow.js
    print("Converting to TensorFlow.js...")
    tfjs.converters.save_keras_model(model, output_dir)
    
    # Fix model.json to ensure proper inputShape for TensorFlow.js
    print("Fixing model.json for TensorFlow.js compatibility...")
    import json
    model_json_path = os.path.join(output_dir, 'model.json')
    with open(model_json_path, 'r') as f:
        model_data = json.load(f)
    
    # Get layers
    layers = model_data['modelTopology']['model_config']['config']['layers']
    
    # Fix model for TensorFlow.js 4.x compatibility
    model_class = model_data['modelTopology']['model_config']['class_name']
    
    if model_class == 'Functional':
        # Functional models have inbound_nodes that TensorFlow.js 4.x may not handle correctly
        # Simplify inbound_nodes to basic format
        for layer in layers:
            if 'inbound_nodes' in layer:
                # Convert complex inbound_nodes to simple array format
                inbound_nodes = layer['inbound_nodes']
                if inbound_nodes and isinstance(inbound_nodes, list):
                    # Simplify: keep only the structure TensorFlow.js expects
                    simplified = []
                    for node in inbound_nodes:
                        if isinstance(node, dict) and 'args' in node:
                            # Extract just the layer references, not the full tensor objects
                            simplified.append([[]])  # Empty array for TensorFlow.js compatibility
                        elif isinstance(node, list):
                            simplified.append(node)
                        else:
                            simplified.append([])
                    layer['inbound_nodes'] = simplified
    
    # Fix InputLayer for TensorFlow.js 4.x compatibility
    # For Sequential models, remove InputLayer and put inputShape in first Dense layer
    # This avoids weight loading issues in TensorFlow.js 4.x
    if model_class == 'Sequential' and layers and layers[0]['class_name'] == 'InputLayer':
        input_config = layers[0]['config']
        
        # Get input shape from InputLayer
        input_shape = None
        if 'inputShape' in input_config:
            input_shape = input_config['inputShape']
        elif 'batch_shape' in input_config:
            batch_shape = input_config['batch_shape']
            if batch_shape and len(batch_shape) == 2:
                input_shape = [batch_shape[1]]
        
        if not input_shape:
            # Try to get from build_input_shape
            build_shape = model_data['modelTopology']['model_config']['config'].get('build_input_shape')
            if build_shape and len(build_shape) == 2:
                input_shape = [build_shape[1]]
        
        # Remove InputLayer
        layers.pop(0)
        
        # Add inputShape to first Dense layer
        if layers and layers[0]['class_name'] == 'Dense' and input_shape:
            layers[0]['config']['inputShape'] = input_shape
        
        # Update build_input_shape
        if input_shape and 'build_input_shape' in model_data['modelTopology']['model_config']['config']:
            model_data['modelTopology']['model_config']['config']['build_input_shape'] = [None] + input_shape
    elif layers and layers[0]['class_name'] == 'InputLayer':
        # For Functional models, keep InputLayer but fix it
        input_config = layers[0]['config']
        
        # Get input shape
        input_shape = None
        if 'inputShape' in input_config:
            input_shape = input_config['inputShape']
        elif 'batch_shape' in input_config:
            batch_shape = input_config['batch_shape']
            if batch_shape and len(batch_shape) == 2:
                input_shape = [batch_shape[1]]
        
        if not input_shape:
            build_shape = model_data['modelTopology']['model_config']['config'].get('build_input_shape')
            if build_shape and len(build_shape) == 2:
                input_shape = [build_shape[1]]
        
        # Remove ALL conflicting fields
        input_config.pop('batch_shape', None)
        input_config.pop('batchInputShape', None)
        input_config.pop('batch_input_shape', None)
        
        # Set inputShape
        if input_shape:
            input_config['inputShape'] = input_shape
    
    # Save the fixed model.json
    with open(model_json_path, 'w') as f:
        json.dump(model_data, f, separators=(',', ':'))
    print("Model.json fixed for TensorFlow.js compatibility")
    
    # Save scaler for preprocessing
    import pickle
    with open(os.path.join(output_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
    
    # Save emotion labels
    with open(os.path.join(output_dir, 'emotions.txt'), 'w') as f:
        f.write('\n'.join(EMOTIONS))
    
    print(f"Model saved to {output_dir}")
    print("Training complete!")

if __name__ == '__main__':
    main()




