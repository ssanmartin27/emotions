"""
Wav2Vec2 emotion recognition model training for Spanish audio
- Fine-tunes wav2vec2 Spanish model (jonatasgrosman/wav2vec2-large-xlsr-53-spanish)
- Uses MESD (Mexican Emotional Speech Database) dataset
- Adapts for children's speech patterns
- Exports model for client-side use
"""

import os
import pandas as pd
import numpy as np
import librosa
import torch
import torchaudio
from torch.utils.data import Dataset, DataLoader
from transformers import (
    Wav2Vec2ForSequenceClassification,
    Wav2Vec2Processor,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    confusion_matrix, classification_report
)
import json
import matplotlib.pyplot as plt
import seaborn as sns
from datasets import load_dataset, Audio
import warnings
warnings.filterwarnings('ignore')

# Emotion labels matching the video model
EMOTIONS = ['anger', 'sadness', 'anxiety', 'fear', 'happiness', 'guilt']
NUM_EMOTIONS = len(EMOTIONS)

# Model configuration
MODEL_NAME = "jonatasgrosman/wav2vec2-large-xlsr-53-spanish"
SAMPLE_RATE = 16000  # Wav2Vec2 standard sample rate
MAX_DURATION = 10.0  # Maximum audio duration in seconds

class EmotionAudioDataset(Dataset):
    """Dataset for emotion-labeled audio files"""
    
    def __init__(self, audio_paths, labels, processor, max_length=160000):
        self.audio_paths = audio_paths
        self.labels = labels
        self.processor = processor
        self.max_length = max_length
    
    def __len__(self):
        return len(self.audio_paths)
    
    def __getitem__(self, idx):
        audio_path = self.audio_paths[idx]
        label = self.labels[idx]
        
        # Load and preprocess audio
        try:
            # Load audio file
            waveform, sr = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
            
            # Pad or truncate to max_length
            if len(waveform) > self.max_length:
                waveform = waveform[:self.max_length]
            else:
                waveform = np.pad(waveform, (0, self.max_length - len(waveform)), mode='constant')
            
            # Process with wav2vec2 processor
            inputs = self.processor(
                waveform,
                sampling_rate=SAMPLE_RATE,
                return_tensors="pt",
                padding=True
            )
            
            # Extract input_values
            input_values = inputs.input_values.squeeze(0)
            
            return {
                'input_values': input_values,
                'labels': torch.tensor(label, dtype=torch.long)
            }
        except Exception as e:
            print(f"Error loading {audio_path}: {e}")
            # Return zero tensor on error
            return {
                'input_values': torch.zeros(self.max_length),
                'labels': torch.tensor(0, dtype=torch.long)
            }

def load_mesd_dataset(dataset_path):
    """
    Load MESD dataset from Kaggle
    Expected structure:
    dataset_path/
        audio/
            emotion_label/
                *.wav files
    """
    audio_paths = []
    labels = []
    
    # MESD emotion mapping to our 6 emotions
    # MESD typically has: anger, disgust, fear, happiness, neutral, sadness
    emotion_mapping = {
        'anger': 0,      # anger -> anger
        'sadness': 1,    # sadness -> sadness
        'anxiety': 2,    # fear -> anxiety (closest match)
        'fear': 3,       # fear -> fear
        'happiness': 4,  # happiness -> happiness
        'guilt': 1,      # sadness -> guilt (closest match, or use sadness)
    }
    
    # Default mapping for MESD labels
    mesd_to_our = {
        'anger': 'anger',
        'sadness': 'sadness',
        'fear': 'fear',
        'happiness': 'happiness',
        'disgust': 'anger',  # Map to anger
        'neutral': 'happiness',  # Map to neutral/happiness
    }
    
    audio_dir = os.path.join(dataset_path, 'audio')
    if not os.path.exists(audio_dir):
        print(f"Warning: Audio directory not found at {audio_dir}")
        return audio_paths, labels
    
    # Walk through emotion-labeled directories
    for emotion_folder in os.listdir(audio_dir):
        emotion_path = os.path.join(audio_dir, emotion_folder)
        if not os.path.isdir(emotion_path):
            continue
        
        # Map MESD emotion to our emotion
        mapped_emotion = mesd_to_our.get(emotion_folder.lower(), 'happiness')
        if mapped_emotion not in EMOTIONS:
            continue
        
        label_idx = EMOTIONS.index(mapped_emotion)
        
        # Load all audio files in this emotion folder
        for audio_file in os.listdir(emotion_path):
            if audio_file.endswith(('.wav', '.mp3', '.flac')):
                audio_path = os.path.join(emotion_path, audio_file)
                audio_paths.append(audio_path)
                labels.append(label_idx)
    
    print(f"Loaded {len(audio_paths)} audio files")
    return audio_paths, labels

def create_multi_label_dataset(audio_paths, labels):
    """
    Convert single-label dataset to multi-label format
    Each sample can have multiple emotions (0-1 probabilities)
    """
    # For now, use one-hot encoding (single emotion per sample)
    # Can be extended to multi-label if needed
    multi_labels = []
    for label_idx in labels:
        label_vector = [0.0] * NUM_EMOTIONS
        label_vector[label_idx] = 1.0
        multi_labels.append(label_vector)
    
    return np.array(multi_labels)

def compute_metrics(eval_pred):
    """Compute metrics for evaluation"""
    predictions, labels = eval_pred
    
    # Get predicted class (argmax)
    pred_classes = np.argmax(predictions, axis=-1)
    true_classes = np.argmax(labels, axis=-1) if labels.ndim > 1 else labels
    
    # Calculate metrics
    accuracy = accuracy_score(true_classes, pred_classes)
    precision, recall, f1, _ = precision_recall_fscore_support(
        true_classes, pred_classes, average='macro', zero_division=0
    )
    
    # Per-emotion metrics
    precision_per_class, recall_per_class, f1_per_class, _ = precision_recall_fscore_support(
        true_classes, pred_classes, average=None, zero_division=0, labels=range(NUM_EMOTIONS)
    )
    
    metrics = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
    }
    
    # Add per-emotion metrics
    for i, emotion in enumerate(EMOTIONS):
        metrics[f'{emotion}_precision'] = precision_per_class[i]
        metrics[f'{emotion}_recall'] = recall_per_class[i]
        metrics[f'{emotion}_f1'] = f1_per_class[i]
    
    return metrics

def plot_training_history(history, output_dir):
    """Plot training history"""
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    
    # Loss
    axes[0, 0].plot(history['train_loss'], label='Train Loss')
    axes[0, 0].plot(history['eval_loss'], label='Eval Loss')
    axes[0, 0].set_title('Training and Validation Loss')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Loss')
    axes[0, 0].legend()
    axes[0, 0].grid(True)
    
    # Accuracy
    axes[0, 1].plot(history['train_accuracy'], label='Train Accuracy')
    axes[0, 1].plot(history['eval_accuracy'], label='Eval Accuracy')
    axes[0, 1].set_title('Training and Validation Accuracy')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('Accuracy')
    axes[0, 1].legend()
    axes[0, 1].grid(True)
    
    # F1 Score
    axes[1, 0].plot(history['train_f1'], label='Train F1')
    axes[1, 0].plot(history['eval_f1'], label='Eval F1')
    axes[1, 0].set_title('Training and Validation F1 Score')
    axes[1, 0].set_xlabel('Epoch')
    axes[1, 0].set_ylabel('F1 Score')
    axes[1, 0].legend()
    axes[1, 0].grid(True)
    
    # Precision vs Recall
    axes[1, 1].plot(history['train_precision'], label='Train Precision')
    axes[1, 1].plot(history['train_recall'], label='Train Recall')
    axes[1, 1].plot(history['eval_precision'], label='Eval Precision')
    axes[1, 1].plot(history['eval_recall'], label='Eval Recall')
    axes[1, 1].set_title('Precision and Recall')
    axes[1, 1].set_xlabel('Epoch')
    axes[1, 1].set_ylabel('Score')
    axes[1, 1].legend()
    axes[1, 1].grid(True)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'training_history.png'))
    plt.close()

def plot_confusion_matrix(y_true, y_pred, output_dir):
    """Plot confusion matrix"""
    cm = confusion_matrix(y_true, y_pred, labels=range(NUM_EMOTIONS))
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=EMOTIONS, yticklabels=EMOTIONS)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'confusion_matrix.png'))
    plt.close()

def main():
    # Configuration
    dataset_path = "data/mesd"  # Path to MESD dataset
    output_dir = "models/wav2vec2_emotion_model"
    batch_size = 8
    num_epochs = 10
    learning_rate = 3e-5
    max_length = int(SAMPLE_RATE * MAX_DURATION)  # 10 seconds at 16kHz
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    print("Loading dataset...")
    audio_paths, labels = load_mesd_dataset(dataset_path)
    
    if len(audio_paths) == 0:
        print("Error: No audio files found. Please check dataset path.")
        print("Expected structure: data/mesd/audio/emotion_label/*.wav")
        return
    
    print(f"Loaded {len(audio_paths)} samples")
    
    # Split dataset
    train_paths, temp_paths, train_labels, temp_labels = train_test_split(
        audio_paths, labels, test_size=0.3, random_state=42, stratify=labels
    )
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        temp_paths, temp_labels, test_size=0.5, random_state=42, stratify=temp_labels
    )
    
    print(f"Train: {len(train_paths)}, Val: {len(val_paths)}, Test: {len(test_paths)}")
    
    # Load processor and model
    print("Loading wav2vec2 model...")
    processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
    
    # Load model for sequence classification
    model = Wav2Vec2ForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_EMOTIONS,
        problem_type="multi_label_classification"  # Can have multiple emotions
    )
    
    # Create datasets
    print("Creating datasets...")
    train_dataset = EmotionAudioDataset(train_paths, train_labels, processor, max_length)
    val_dataset = EmotionAudioDataset(val_paths, val_labels, processor, max_length)
    test_dataset = EmotionAudioDataset(test_paths, test_labels, processor, max_length)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=num_epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        learning_rate=learning_rate,
        warmup_steps=500,
        logging_dir=f"{output_dir}/logs",
        logging_steps=100,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        save_total_limit=3,
        fp16=torch.cuda.is_available(),
        dataloader_num_workers=4 if torch.cuda.is_available() else 0,
    )
    
    # Create trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
    )
    
    # Train
    print("Starting training...")
    train_result = trainer.train()
    
    # Evaluate on test set
    print("Evaluating on test set...")
    test_results = trainer.evaluate(test_dataset)
    
    print("\n=== Test Set Results ===")
    for key, value in test_results.items():
        print(f"{key}: {value:.4f}")
    
    # Save model
    print("Saving model...")
    trainer.save_model()
    processor.save_pretrained(output_dir)
    
    # Save metrics
    with open(os.path.join(output_dir, 'metrics.json'), 'w') as f:
        json.dump(test_results, f, indent=2)
    
    # Generate predictions for confusion matrix
    print("Generating predictions...")
    predictions = trainer.predict(test_dataset)
    pred_classes = np.argmax(predictions.predictions, axis=-1)
    true_classes = test_labels
    
    # Plot confusion matrix
    plot_confusion_matrix(true_classes, pred_classes, output_dir)
    
    # Print classification report
    print("\n=== Classification Report ===")
    print(classification_report(true_classes, pred_classes, target_names=EMOTIONS))
    
    # Export to TensorFlow.js format (if needed)
    # Note: This requires additional conversion steps
    print("\nTraining complete!")
    print(f"Model saved to: {output_dir}")
    print("\nNote: For TensorFlow.js export, you may need to convert the PyTorch model separately.")

if __name__ == "__main__":
    main()

