FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --workspace=server && npm ci --workspace=client

# Copy source code
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Build server
WORKDIR /app/server
RUN npm run build

WORKDIR /app

# Expose port (will be overridden by docker-compose)
EXPOSE 3001

# Start server
CMD ["node", "dist/server/src/server.js"]
