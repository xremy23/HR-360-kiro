# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --no-audit

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install a simple HTTP server to serve the static files
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Start the server on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
