# Audio Emotion Model Training Guide

This guide explains how to train the wav2vec2 Spanish model for emotion recognition using the MESD (Mexican Emotional Speech Database) dataset.

## Prerequisites

1. Python 3.8 or higher
2. PyTorch (with CUDA support recommended)
3. Transformers library from HuggingFace
4. Access to the MESD dataset from Kaggle

## Dataset Setup

### 1. Download MESD Dataset

1. Go to [MESD Dataset on Kaggle](https://www.kaggle.com/datasets/saurabhshahane/mexican-emotional-speech-database-mesd/data)
2. Download the dataset
3. Extract it to `data/mesd/` directory

### 2. Expected Directory Structure

```
data/
  mesd/
    audio/
      anger/
        *.wav files
      sadness/
        *.wav files
      fear/
        *.wav files
      happiness/
        *.wav files
      disgust/
        *.wav files
      neutral/
        *.wav files
```

## Installation

Install required dependencies:

```bash
pip install torch torchaudio transformers datasets librosa scikit-learn matplotlib seaborn pandas numpy
```

## Training

### 1. Run Training Script

```bash
python training/train_wav2vec2_emotion.py
```

### 2. Configuration

Edit the script to adjust:
- `dataset_path`: Path to MESD dataset (default: `data/mesd`)
- `output_dir`: Where to save the model (default: `models/wav2vec2_emotion_model`)
- `batch_size`: Training batch size (default: 8)
- `num_epochs`: Number of training epochs (default: 10)
- `learning_rate`: Learning rate (default: 3e-5)

### 3. Training Process

The script will:
1. Load and preprocess the MESD dataset
2. Fine-tune the wav2vec2 Spanish model (`jonatasgrosman/wav2vec2-large-xlsr-53-spanish`)
3. Train for emotion classification (6 emotions: anger, sadness, anxiety, fear, happiness, guilt)
4. Evaluate on test set
5. Save the model and metrics

### 4. Model Export

The trained model will be saved in PyTorch format. For client-side use, you'll need to:

1. Convert to ONNX format (recommended for Transformers.js)
2. Or use Transformers.js directly with the PyTorch model (requires additional setup)

## Model Conversion for Client-Side Use

### Option 1: ONNX Conversion

```python
from transformers import Wav2Vec2ForSequenceClassification
import torch

# Load trained model
model = Wav2Vec2ForSequenceClassification.from_pretrained("models/wav2vec2_emotion_model")

# Convert to ONNX
torch.onnx.export(
    model,
    (dummy_input,),
    "models/wav2vec2_emotion_model/model.onnx",
    input_names=["input_values"],
    output_names=["logits"],
    dynamic_axes={"input_values": {0: "batch"}, "logits": {0: "batch"}},
)
```

### Option 2: Use Transformers.js

Transformers.js can load HuggingFace models directly. Ensure the model is uploaded to HuggingFace Hub or accessible via the model path.

## Integration

### 1. Place Model Files

Copy the trained model to `public/models/wav2vec2_emotion_model/`:
- `config.json`
- `pytorch_model.bin` or `model.safetensors`
- `preprocessor_config.json` (if available)

### 2. Update Model Path

In `app/utils/audioEmotionPredictor.ts`, update `MODEL_PATH` if needed:
```typescript
const MODEL_PATH = '/models/wav2vec2_emotion_model'
```

### 3. Test Model

Test the model with sample audio files to ensure it's working correctly.

## Notes

- The model is fine-tuned for Spanish audio
- Emotion mapping from MESD to our 6 emotions may need adjustment based on your dataset
- Model size can be large; consider quantization for production
- Training time depends on dataset size and hardware (GPU recommended)

## Troubleshooting

### Out of Memory Errors
- Reduce `batch_size`
- Use gradient accumulation
- Enable mixed precision training (`fp16=True`)

### Poor Performance
- Increase training epochs
- Adjust learning rate
- Check data quality and labeling
- Consider data augmentation

### Model Not Loading in Browser
- Ensure model is in correct format (ONNX or compatible with Transformers.js)
- Check model file paths
- Verify CORS settings if loading from external source

