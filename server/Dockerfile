# Production-ready Dockerfile for AI Interview Coach backend
# Build context: the 'server' folder. Run: docker build -t ai-interview-coach-server:latest ./server

FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (production only)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Expose default port (make sure your app reads PORT env or defaults to 5000)
EXPOSE 5000

# Use NODE_ENV=production by default
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/index.js"]
