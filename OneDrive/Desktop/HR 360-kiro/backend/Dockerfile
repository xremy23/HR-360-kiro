FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript (if needed)
RUN npm run build 2>/dev/null || true

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
