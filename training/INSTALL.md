# Installation Instructions for Emotion Model Training

Due to dependency conflicts and NumPy compatibility issues, install packages in the following order:

## Step-by-Step Installation

### Option 1: Manual Installation (Recommended)

```bash
# 1. Install NumPy first with version constraint (required for tensorflowjs compatibility)
pip install "numpy>=1.24.0,<2.0.0"

# 2. Install TensorFlow
pip install tensorflow

# 3. Install TensorFlow.js (this may take a moment to resolve dependencies)
pip install tensorflowjs

# 4. Install other dependencies
pip install pandas scikit-learn
```

**Important:** NumPy must be installed first with the version constraint `<2.0.0` because TensorFlow.js uses deprecated NumPy attributes (`np.object`, `np.bool`) that were removed in NumPy 2.0.

### Option 2: Using the Installation Script

**Windows (PowerShell):**
```powershell
.\install_dependencies.ps1
```

**Linux/Mac:**
```bash
chmod +x install_dependencies.sh
./install_dependencies.sh
```

### Option 3: Using requirements.txt (may still have conflicts)

```bash
pip install -r requirements.txt
```

If Option 3 fails, use Option 1 or 2 instead.

## Verify Installation

After installation, verify everything works:

```python
python -c "import tensorflow as tf; import tensorflowjs as tfjs; print('TensorFlow:', tf.__version__); print('TensorFlow.js converter available')"
```

## Training the Model

Once dependencies are installed, run:

```bash
python train_emotion_model.py
```

The trained model will be saved to `public/models/emotion_model/`

