# Multi-stage build for Node.js Backend
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript (if using TypeScript)
RUN npm run build || echo "No build step configured"

# Final stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk --no-cache add curl

# Create non-root user
RUN addgroup -g 1001 -S backend && \
    adduser -u 1001 -S backend -G backend

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Change ownership
RUN chown -R backend:backend /app

# Switch to non-root user
USER backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Run the application
CMD ["npm", "start"] 