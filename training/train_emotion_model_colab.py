"""
Train emotion recognition model from expression_dataset - Google Colab Version
Maps AUs and valence to 6 emotions: anger, sadness, anxiety, fear, happiness, guilt

This script is optimized for Google Colab and includes comprehensive quality metrics.
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, mean_squared_error, mean_absolute_error
)
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
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

def calculate_metrics(y_true, y_pred, threshold=0.5):
    """
    Calculate comprehensive metrics for multi-label classification
    Returns metrics per emotion and overall metrics
    """
    # Convert probabilities to binary predictions
    y_pred_binary = (y_pred >= threshold).astype(int)
    y_true_binary = (y_true >= threshold).astype(int)
    
    metrics = {}
    
    # Overall metrics (micro-averaged)
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
        }
    
    return metrics

def plot_training_history(history):
    """Plot training history"""
    fig, axes = plt.subplots(1, 3, figsize=(15, 4))
    
    # Loss
    axes[0].plot(history.history['loss'], label='Training Loss')
    axes[0].plot(history.history['val_loss'], label='Validation Loss')
    axes[0].set_title('Model Loss')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].legend()
    axes[0].grid(True)
    
    # Accuracy
    axes[1].plot(history.history['accuracy'], label='Training Accuracy')
    axes[1].plot(history.history['val_accuracy'], label='Validation Accuracy')
    axes[1].set_title('Model Accuracy')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy')
    axes[1].legend()
    axes[1].grid(True)
    
    # MSE
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
    
    # Explicitly set labels to always include both classes
    labels = [0, 1]
    
    for i, emotion in enumerate(EMOTIONS):
        cm = confusion_matrix(
            y_true_binary[:, i], 
            y_pred_binary[:, i], 
            labels=labels
        )
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[i], 
                   xticklabels=['Low', 'High'], yticklabels=['Low', 'High'],
                   vmin=0)  # Ensure color scale starts at 0
        axes[i].set_title(f'{emotion.capitalize()} Confusion Matrix')
        axes[i].set_ylabel('True Label')
        axes[i].set_xlabel('Predicted Label')
    
    plt.tight_layout()
    plt.show()

def main():
    # For Google Colab, you can mount Google Drive or upload files
    # Update these paths based on your Colab setup
    print("=" * 60)
    print("Emotion Recognition Model Training - Google Colab Version")
    print("=" * 60)
    
    # Paths - adjust these for your Colab setup
    # Option 1: If you uploaded files to Colab
    aus_dir = '/content/expression_dataset/AUs'
    valences_dir = '/content/expression_dataset/Valences'
    output_dir = '/content/emotion_model'
    
    # Option 2: If using Google Drive (uncomment and mount drive first)
    # from google.colab import drive
    # drive.mount('/content/drive')
    # aus_dir = '/content/drive/MyDrive/emotions/app/expression_dataset/AUs'
    # valences_dir = '/content/drive/MyDrive/emotions/app/expression_dataset/Valences'
    # output_dir = '/content/drive/MyDrive/emotions/public/models/emotion_model'
    
    print(f"\nDataset paths:")
    print(f"  AUs directory: {aus_dir}")
    print(f"  Valences directory: {valences_dir}")
    print(f"  Output directory: {output_dir}")
    
    # Check if directories exist
    if not os.path.exists(aus_dir):
        print(f"\nERROR: AUs directory not found: {aus_dir}")
        print("Please update the paths in the script or upload your dataset.")
        return
    
    if not os.path.exists(valences_dir):
        print(f"\nERROR: Valences directory not found: {valences_dir}")
        print("Please update the paths in the script or upload your dataset.")
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
    print(f"✓ Features: {X.shape[1]} AUs")
    print(f"✓ Emotions: {len(EMOTIONS)} ({', '.join(EMOTIONS)})")
    print(f"✓ Output range: 0-1 probability scale for each emotion")
    print(f"✓ Label range: min={y.min():.2f}, max={y.max():.2f}, mean={y.mean():.2f}")
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )
    
    print(f"\n✓ Training set: {X_train.shape}")
    print(f"✓ Test set: {X_test.shape}")
    
    print("\n" + "=" * 60)
    print("Step 3: Building model...")
    print("=" * 60)
    model = build_frame_model(X_train.shape[1], len(EMOTIONS))
    print("\nModel Architecture:")
    model.summary()
    
    print("\n" + "=" * 60)
    print("Step 4: Training model...")
    print("=" * 60)
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=50,
        validation_data=(X_test, y_test),
        verbose=1
    )
    
    # Plot training history
    print("\n" + "=" * 60)
    print("Training History:")
    print("=" * 60)
    plot_training_history(history)
    
    print("\n" + "=" * 60)
    print("Step 5: Evaluating model...")
    print("=" * 60)
    
    # Get predictions
    y_train_pred = model.predict(X_train, verbose=0)
    y_test_pred = model.predict(X_test, verbose=0)
    
    # Calculate metrics
    train_metrics = calculate_metrics(y_train, y_train_pred)
    test_metrics = calculate_metrics(y_test, y_test_pred)
    
    # Print overall metrics
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
    print("MACRO-AVERAGED METRICS (Test Set)")
    print("-" * 60)
    print(f"Precision: {test_metrics['macro']['precision']:.4f}")
    print(f"Recall:    {test_metrics['macro']['recall']:.4f}")
    print(f"F1-Score:  {test_metrics['macro']['f1_score']:.4f}")
    
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
    
    # Plot confusion matrices
    print("\n" + "=" * 60)
    print("Confusion Matrices (Test Set):")
    print("=" * 60)
    plot_confusion_matrices(y_test, y_test_pred)
    
    # Save model and metrics
    print("\n" + "=" * 60)
    print("Step 6: Saving model and metrics...")
    print("=" * 60)
    os.makedirs(output_dir, exist_ok=True)
    
    # Save TensorFlow model
    model_path = os.path.join(output_dir, 'model.h5')
    model.save(model_path)
    print(f"✓ Saved TensorFlow model: {model_path}")
    
    # Convert to TensorFlow.js
    print("Converting to TensorFlow.js...")
    tfjs.converters.save_keras_model(model, output_dir)
    print(f"✓ Saved TensorFlow.js model to: {output_dir}")
    
    # Save scaler
    import pickle
    scaler_path = os.path.join(output_dir, 'scaler.pkl')
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"✓ Saved scaler: {scaler_path}")
    
    # Convert scaler to JSON for web use
    scaler_json = {
        'mean': scaler.mean_.tolist(),
        'scale': scaler.scale_.tolist()
    }
    scaler_json_path = os.path.join(output_dir, 'scaler.json')
    with open(scaler_json_path, 'w') as f:
        json.dump(scaler_json, f, indent=2)
    print(f"✓ Saved scaler JSON: {scaler_json_path}")
    
    # Save emotion labels
    emotions_path = os.path.join(output_dir, 'emotions.txt')
    with open(emotions_path, 'w') as f:
        f.write('\n'.join(EMOTIONS))
    print(f"✓ Saved emotion labels: {emotions_path}")
    
    # Save metrics
    metrics_path = os.path.join(output_dir, 'metrics.json')
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
    with open(metrics_path, 'w') as f:
        json.dump(metrics_to_save, f, indent=2)
    print(f"✓ Saved metrics: {metrics_path}")
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print(f"\nModel and files saved to: {output_dir}")
    print("\nTo download the model files from Colab:")
    print("  from google.colab import files")
    print("  import shutil")
    print("  shutil.make_archive('emotion_model', 'zip', output_dir)")
    print("  files.download('emotion_model.zip')")

if __name__ == '__main__':
    main()

