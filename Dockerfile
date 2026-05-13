FROM python:3.11-slim

# Create a non-root user with UID 1000 as required by Hugging Face Spaces
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy application files and transfer ownership to the user
COPY --chown=user . $HOME/app

# We need to temporarily switch to root to install Node.js (for building the React frontend)
USER root
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Switch back to the non-root user for security
USER user

# Step 1: Build the React Frontend
WORKDIR $HOME/app/frontend
RUN npm install
RUN npm run build

# Step 2: Install Python Backend Dependencies
WORKDIR $HOME/app
# We explicitly install the CPU-only version of PyTorch to keep the image small and prevent HF Spaces from crashing
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Step 3: Download the AI Model Weights
# This script downloads the large .pth model files from Google Drive during the Docker build process
RUN python download_model.py

# Set the environment variables so the backend knows where the model is
ENV MODEL_PATH=models/cattle_breed_classifier_full_model.pth
ENV MODEL_NAME=resnet50
ENV CLASSES_PATH=models/classes.txt

# Hugging Face Spaces requires exposing port 7860
EXPOSE 7860

# Start the unified FastAPI server which serves BOTH the Python API and the React static files
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
