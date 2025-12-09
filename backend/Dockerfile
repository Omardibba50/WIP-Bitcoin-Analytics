# Backend Dockerfile
# Using Debian-based image instead of Alpine for @tensorflow/tfjs-node compatibility
FROM node:20-slim

# Install build dependencies for native modules (better-sqlite3, tfjs-node)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with verbose logging
RUN npm ci --only=production --verbose || \
    (echo "Production install failed, trying without --only=production" && npm ci)

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 5000

# Health check disabled to prevent Railway deployment timeout
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with error logging
CMD ["sh", "-c", "echo 'Starting server...' && node server.js 2>&1 | tee /tmp/server.log"]
