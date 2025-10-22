# Multi-stage build for Go Mangle Service
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o mangle-svc .

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates curl

# Create non-root user
RUN addgroup -g 1001 -S mangle && \
    adduser -u 1001 -S mangle -G mangle

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/mangle-svc .

# Copy rules directory (if exists)
COPY --from=builder /app/rules ./rules

# Change ownership
RUN chown -R mangle:mangle /app

# Switch to non-root user
USER mangle

# Expose port
EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8088/health || exit 1

# Run the service
CMD ["./mangle-svc"] 