#!/bin/bash
# Bash script to install dependencies for emotion model training
# Run this if pip install -r requirements.txt fails due to conflicts

echo "Installing dependencies for emotion model training..."
echo "This will install packages one at a time to avoid dependency conflicts."
echo ""

# Install NumPy first with version constraint (required for tensorflowjs compatibility)
echo "Step 1/5: Installing NumPy (compatible version)..."
pip install "numpy>=1.24.0,<2.0.0" || {
    echo "Failed to install NumPy."
    exit 1
}

# Install TensorFlow (required for Python 3.12)
echo ""
echo "Step 2/5: Installing TensorFlow..."
pip install tensorflow || {
    echo "Failed to install TensorFlow. Please check your Python version (3.12+ required)."
    exit 1
}

# Install TensorFlow.js (may need to be installed separately to resolve conflicts)
echo ""
echo "Step 3/5: Installing TensorFlow.js..."
pip install tensorflowjs || {
    echo "Warning: TensorFlow.js installation had issues, but continuing..."
}

# Install pandas
echo ""
echo "Step 4/5: Installing pandas..."
pip install pandas

# Install scikit-learn
echo ""
echo "Step 5/5: Installing scikit-learn..."
pip install scikit-learn

echo ""
echo "Dependencies installed successfully!"
echo "You can now run: python train_emotion_model.py"

