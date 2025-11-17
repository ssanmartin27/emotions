# Google Colab Setup Guide for Emotion Model Training

## Quick Start

1. **Open Google Colab**: Go to [colab.research.google.com](https://colab.research.google.com)

2. **Create a new notebook** and run these setup cells:

### Cell 1: Install Dependencies
```python
!pip install tensorflow tensorflowjs pandas numpy scikit-learn matplotlib seaborn
```

### Cell 2: Upload Dataset
```python
from google.colab import files
import zipfile
import os

# Upload your expression_dataset.zip file
uploaded = files.upload()

# Extract if needed
for filename in uploaded.keys():
    if filename.endswith('.zip'):
        with zipfile.ZipFile(filename, 'r') as zip_ref:
            zip_ref.extractall('/content')
        print(f"Extracted {filename}")
```

Or mount Google Drive:
```python
from google.colab import drive
drive.mount('/content/drive')

# Then update paths in the script to point to your Drive folder
```

### Cell 3: Copy Training Script
```python
# Copy the train_emotion_model_colab.py content into this cell
# Or upload the file and read it
```

### Cell 4: Run Training
```python
# Update paths in the script if needed, then run:
exec(open('train_emotion_model_colab.py').read())
# Or if you pasted the code directly, just run it
```

### Cell 5: Download Model
```python
from google.colab import files
import shutil

# Create zip file
shutil.make_archive('emotion_model', 'zip', '/content/emotion_model')

# Download
files.download('emotion_model.zip')
```

## Expected Output

The script will output:
- Training progress with loss and accuracy
- Training history plots (loss, accuracy, MSE)
- **Overall metrics**: Accuracy, Precision, Recall, F1-Score, MSE, MAE
- **Macro-averaged metrics**: Precision, Recall, F1-Score
- **Per-emotion metrics**: Detailed metrics for each emotion
- **Confusion matrices**: For each emotion

## Files Generated

After training, you'll have:
- `model.h5` - TensorFlow model
- `model.json` + `*.bin` - TensorFlow.js model files
- `scaler.pkl` - Scaler for preprocessing (Python)
- `scaler.json` - Scaler for preprocessing (JavaScript/Web)
- `emotions.txt` - Emotion labels
- `metrics.json` - All quality metrics in JSON format

## Path Configuration

Update these paths in the script based on your setup:

**If uploading files directly:**
```python
aus_dir = '/content/expression_dataset/AUs'
valences_dir = '/content/expression_dataset/Valences'
output_dir = '/content/emotion_model'
```

**If using Google Drive:**
```python
aus_dir = '/content/drive/MyDrive/emotions/app/expression_dataset/AUs'
valences_dir = '/content/drive/MyDrive/emotions/app/expression_dataset/Valences'
output_dir = '/content/drive/MyDrive/emotions/public/models/emotion_model'
```

## Quality Metrics Explained

- **Accuracy**: Overall correctness of predictions
- **Precision**: Of predicted positives, how many were actually positive
- **Recall**: Of actual positives, how many were correctly predicted
- **F1-Score**: Harmonic mean of precision and recall
- **MSE (Mean Squared Error)**: Average squared difference between predicted and actual values
- **MAE (Mean Absolute Error)**: Average absolute difference between predicted and actual values

Metrics are calculated:
- **Overall**: Across all emotions and samples (micro-averaged)
- **Macro**: Average of per-emotion metrics (macro-averaged)
- **Per-emotion**: Individual metrics for each emotion

