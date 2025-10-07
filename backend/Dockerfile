# --- Stage 1: The Builder ---
# Use a full OS image (Debian Bookworm) which includes all the necessary
# compilers and tools to build complex Python packages from source.
FROM python:3.11-bookworm AS builder

# Set the working directory for this stage
WORKDIR /app

# Install system-level build tools like gcc and g++
RUN apt-get update && apt-get install -y build-essential

# Copy only the requirements file to leverage Docker's caching
COPY requirements.txt .

# --- The Main Optimization ---
# Install the heaviest and most problematic packages individually.
# This creates stable, cached layers that won't need to be rebuilt often.
# A long timeout is added to prevent network issues on large downloads.

# 1. Install the CPU-only version of PyTorch. This is much smaller and more reliable.
RUN pip install --no-cache-dir --timeout=900 torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 2. Install FAISS, another heavy C++ library.
RUN pip install --no-cache-dir --timeout=900 faiss-cpu

# 3. Install the rest of the dependencies. Pip will see that torch is
#    already installed and will intelligently skip it.
RUN pip install --no-cache-dir --timeout=900 -r requirements.txt


# --- Stage 2: The Final Production Image ---
# Start fresh with a small, lightweight "slim" image for the final container.
FROM python:3.11-slim-bookworm

# Set the working directory for the final application
WORKDIR /app

# Copy the pre-installed Python packages from the 'builder' stage.
# This is the key to the multi-stage build: we did the hard work in the builder,
# and now we just copy the clean results into our final image.
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the application source code into the final image
COPY . .

# Expose the port that the FastAPI application will run on
EXPOSE 8000

# The command to run the application when the container starts
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]