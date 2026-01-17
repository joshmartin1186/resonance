# Build stage
FROM node:20-bullseye AS builder

WORKDIR /app

# Install build dependencies for native modules (canvas, gl, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python-is-python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    libxi-dev \
    libglfw3-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy worker package files only
COPY worker/package*.json ./

# Install dependencies
RUN npm ci

# Copy worker source code only
COPY worker/tsconfig.json ./
COPY worker/src ./src

# Build TypeScript
RUN npm run build

# Production stage - RunPod GPU-optimized
FROM node:20-bullseye AS runner

WORKDIR /app

# Install FFmpeg, OpenGL/Mesa for GPU rendering, and build dependencies for native modules
RUN apt-get update && apt-get install -y \
    ffmpeg \
    mesa-utils \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglu1-mesa \
    libglew-dev \
    libglfw3-dev \
    libxi-dev \
    libxrandr-dev \
    libxinerama-dev \
    libxcursor-dev \
    libxxf86vm-dev \
    build-essential \
    python3 \
    python-is-python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set up GPU rendering environment
ENV LIBGL_ALWAYS_SOFTWARE=0
ENV MESA_GL_VERSION_OVERRIDE=3.3

# Copy package files and install production dependencies only
COPY worker/package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production

# Expose port for RunPod
EXPOSE 8000

# Run the RunPod serverless handler
CMD ["node", "dist/runpod-start.js"]
