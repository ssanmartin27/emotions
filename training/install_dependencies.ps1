# PowerShell script to install dependencies for emotion model training
# Run this if pip install -r requirements.txt fails due to conflicts

Write-Host "Installing dependencies for emotion model training..." -ForegroundColor Green
Write-Host "This will install packages one at a time to avoid dependency conflicts." -ForegroundColor Yellow
Write-Host ""

# Install NumPy first with version constraint (required for tensorflowjs compatibility)
Write-Host "Step 1/5: Installing NumPy (compatible version)..." -ForegroundColor Cyan
pip install "numpy>=1.24.0,<2.0.0"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install NumPy." -ForegroundColor Red
    exit 1
}

# Install TensorFlow (required for Python 3.12)
Write-Host "`nStep 2/5: Installing TensorFlow..." -ForegroundColor Cyan
pip install tensorflow
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install TensorFlow. Please check your Python version (3.12+ required)." -ForegroundColor Red
    exit 1
}

# Install TensorFlow.js (may need to be installed separately to resolve conflicts)
Write-Host "`nStep 3/5: Installing TensorFlow.js..." -ForegroundColor Cyan
pip install tensorflowjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: TensorFlow.js installation had issues, but continuing..." -ForegroundColor Yellow
}

# Install pandas
Write-Host "`nStep 4/5: Installing pandas..." -ForegroundColor Cyan
pip install pandas

# Install scikit-learn
Write-Host "`nStep 5/5: Installing scikit-learn..." -ForegroundColor Cyan
pip install scikit-learn

Write-Host "`nDependencies installed successfully!" -ForegroundColor Green
Write-Host "You can now run: python train_emotion_model.py" -ForegroundColor Green

