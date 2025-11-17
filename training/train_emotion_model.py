"""
Train emotion recognition model from expression_dataset
Maps AUs and valence to 6 emotions: anger, sadness, anxiety, fear, happiness, guilt
"""

import os
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
    
    # Happiness: High AU06 + AU12 (positive valence)
    if valence_label == 'P':
        happiness_score = (aus['AU06'] + aus['AU12']) / 2.0
        emotion_scores['happiness'] = min(1.0, happiness_score / 2.5)  # Normalize to 0-1
    
    # Anger: High AU04 + AU05 + AU07 (negative valence)
    if valence_label == 'N':
        anger_score = (aus['AU04'] + aus['AU05'] + aus['AU07']) / 3.0
        emotion_scores['anger'] = min(1.0, anger_score / 2.0)
    
    # Sadness: High AU01 + AU04 + AU15 (negative valence)
    if valence_label == 'N':
        sadness_score = (aus['AU01'] + aus['AU04'] + aus['AU15']) / 3.0
        emotion_scores['sadness'] = min(1.0, sadness_score / 2.0)
    
    # Fear: High AU01 + AU02 + AU04 + AU05 + AU20 (negative valence)
    if valence_label == 'N':
        fear_score = (aus['AU01'] + aus['AU02'] + aus['AU04'] + aus['AU05'] + aus['AU20']) / 5.0
        emotion_scores['fear'] = min(1.0, fear_score / 1.5)
    
    # Anxiety: Similar to fear but with AU17 (negative valence)
    if valence_label == 'N':
        anxiety_score = (aus['AU01'] + aus['AU02'] + aus['AU04'] + aus['AU05'] + aus['AU17']) / 5.0
        emotion_scores['anxiety'] = min(1.0, anxiety_score / 1.5)
    
    # Guilt: AU01 + AU04 + AU15 + AU17 (sadness-like, negative valence)
    if valence_label == 'N':
        guilt_score = (aus['AU01'] + aus['AU04'] + aus['AU15'] + aus['AU17']) / 4.0
        emotion_scores['guilt'] = min(1.0, guilt_score / 2.0)
    
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
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
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
    
    # Train model
    print("Training model...")
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=50,
        validation_data=(X_test, y_test),
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




