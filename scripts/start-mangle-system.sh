#!/bin/bash

# 🚀 JunoSixteen Mangle System Starter
# Startet alle Services für die Mangle Integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MANGLE_PORT=8088
BACKEND_PORT=5000
POSTGRES_PORT=5432
REDIS_PORT=6379

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MANGLE_DIR="$PROJECT_ROOT/services/mangle"
BACKEND_DIR="$PROJECT_ROOT/backend"
INFRA_DIR="$PROJECT_ROOT/infra"

echo -e "${BLUE}🚀 Starting JunoSixteen Mangle System...${NC}"
echo "Project root: $PROJECT_ROOT"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "\n${RED}❌ $name failed to start after $max_attempts seconds${NC}"
    return 1
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    
    # Kill background processes
    if [ -f "$MANGLE_DIR/mangle.pid" ]; then
        kill $(cat "$MANGLE_DIR/mangle.pid") 2>/dev/null || true
        rm -f "$MANGLE_DIR/mangle.pid"
    fi
    
    if [ -f "$BACKEND_DIR/backend.pid" ]; then
        kill $(cat "$BACKEND_DIR/backend.pid") 2>/dev/null || true
        rm -f "$BACKEND_DIR/backend.pid"
    fi
    
    # Stop Docker services if running
    if command -v docker-compose >/dev/null 2>&1; then
        cd "$INFRA_DIR" && docker-compose down >/dev/null 2>&1 || true
    fi
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Parse command line arguments
MODE="local"
SKIP_DEPS="false"
RUN_TESTS="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --docker)
            MODE="docker"
            shift
            ;;
        --skip-deps)
            SKIP_DEPS="true"
            shift
            ;;
        --test)
            RUN_TESTS="true"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --docker     Use Docker Compose instead of local services"
            echo "  --skip-deps  Skip dependency installation"
            echo "  --test       Run integration tests after startup"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Mode: $MODE"
echo "  Skip deps: $SKIP_DEPS"
echo "  Run tests: $RUN_TESTS"
echo ""

if [ "$MODE" = "docker" ]; then
    echo -e "${BLUE}🐳 Starting with Docker Compose...${NC}"
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        echo -e "${RED}❌ docker-compose is not installed${NC}"
        exit 1
    fi
    
    cd "$INFRA_DIR"
    
    # Start services
    echo -e "${YELLOW}🏗️  Building and starting services...${NC}"
    docker-compose up -d --build
    
    # Wait for services
    wait_for_service "http://localhost:$MANGLE_PORT/health" "Mangle Service"
    wait_for_service "http://localhost:$BACKEND_PORT/health" "Backend API"
    
    echo -e "${GREEN}🎉 Docker services are running!${NC}"
    
else
    echo -e "${BLUE}🏠 Starting locally...${NC}"
    
    # Check ports
    check_port $MANGLE_PORT || exit 1
    check_port $BACKEND_PORT || exit 1
    
    # Install dependencies
    if [ "$SKIP_DEPS" = "false" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        
        # Mangle service (Go)
        echo "Installing Go dependencies..."
        cd "$MANGLE_DIR"
        go mod download
        go mod verify
        
        # Backend (Node.js)
        echo "Installing Node.js dependencies..."
        cd "$BACKEND_DIR"
        npm ci
        
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    fi
    
    # Build Mangle service
    echo -e "${YELLOW}🏗️  Building Mangle service...${NC}"
    cd "$MANGLE_DIR"
    go build -o mangle-svc .
    
    # Start Mangle service
    echo -e "${YELLOW}🚀 Starting Mangle service...${NC}"
    export MANGLE_FAKE=1
    export PORT=$MANGLE_PORT
    ./mangle-svc &
    echo $! > mangle.pid
    
    # Wait for Mangle service
    wait_for_service "http://localhost:$MANGLE_PORT/health" "Mangle Service"
    
    # Start Backend
    echo -e "${YELLOW}🚀 Starting Backend API...${NC}"
    cd "$BACKEND_DIR"
    export PORT=$BACKEND_PORT
    export MANGLE_URL="http://localhost:$MANGLE_PORT"
    export NODE_ENV=development
    npm start &
    echo $! > backend.pid
    
    # Wait for Backend
    wait_for_service "http://localhost:$BACKEND_PORT/health" "Backend API"
    
    echo -e "${GREEN}🎉 Local services are running!${NC}"
fi

# Show service status
echo -e "${BLUE}📊 Service Status:${NC}"
echo "  🔧 Mangle Service: http://localhost:$MANGLE_PORT"
echo "  🌐 Backend API: http://localhost:$BACKEND_PORT"
echo "  📋 API Docs: http://localhost:$BACKEND_PORT/api/policy/info"
echo ""

# Run integration tests if requested
if [ "$RUN_TESTS" = "true" ]; then
    echo -e "${YELLOW}🧪 Running integration tests...${NC}"
    
    # Test health endpoints
    echo "Testing health endpoints..."
    curl -f "http://localhost:$MANGLE_PORT/health" >/dev/null
    curl -f "http://localhost:$BACKEND_PORT/health" >/dev/null
    
    # Test policy endpoints with sample data
    echo "Testing policy decision endpoint..."
    cd "$BACKEND_DIR"
    
    # Happy path test
    RESPONSE=$(curl -s -X POST "http://localhost:$BACKEND_PORT/api/policy/decision" \
        -H "Content-Type: application/json" \
        -d @test/fixtures/test-happy.json)
    
    if echo "$RESPONSE" | grep -q "PASSED"; then
        echo -e "${GREEN}✅ Happy path test passed${NC}"
    else
        echo -e "${RED}❌ Happy path test failed${NC}"
        echo "Response: $RESPONSE"
    fi
    
    # Risk fail test
    RESPONSE=$(curl -s -X POST "http://localhost:$BACKEND_PORT/api/policy/decision" \
        -H "Content-Type: application/json" \
        -d @test/fixtures/test-risk-fail.json)
    
    if echo "$RESPONSE" | grep -q "RESET_RISK"; then
        echo -e "${GREEN}✅ Risk fail test passed${NC}"
    else
        echo -e "${RED}❌ Risk fail test failed${NC}"
        echo "Response: $RESPONSE"
    fi
    
    # Deadline miss test
    RESPONSE=$(curl -s -X POST "http://localhost:$BACKEND_PORT/api/policy/decision" \
        -H "Content-Type: application/json" \
        -d @test/fixtures/test-deadline-miss.json)
    
    if echo "$RESPONSE" | grep -q "RESET_DEADLINE"; then
        echo -e "${GREEN}✅ Deadline miss test passed${NC}"
    else
        echo -e "${RED}❌ Deadline miss test failed${NC}"
        echo "Response: $RESPONSE"
    fi
    
    echo -e "${GREEN}🎉 All tests completed!${NC}"
fi

# Show useful commands
echo -e "${BLUE}💡 Useful Commands:${NC}"
echo "  Test endpoints:"
echo "    curl http://localhost:$MANGLE_PORT/health"
echo "    curl http://localhost:$BACKEND_PORT/api/policy/info"
echo ""
echo "  Test policy decision:"
echo "    curl -X POST http://localhost:$BACKEND_PORT/api/policy/decision \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d @backend/test/fixtures/test-happy.json"
echo ""
echo "  Stop services: Ctrl+C or kill this script"
echo ""

if [ "$MODE" = "local" ]; then
    echo -e "${GREEN}🎯 Services are running in the background${NC}"
    echo -e "${YELLOW}📝 PIDs saved to:${NC}"
    echo "  Mangle: $MANGLE_DIR/mangle.pid"
    echo "  Backend: $BACKEND_DIR/backend.pid"
    echo ""
    echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
    
    # Keep script running
    while true; do
        sleep 1
    done
else
    echo -e "${GREEN}🐳 Docker services are running${NC}"
    echo -e "${BLUE}Use 'docker-compose -f $INFRA_DIR/docker-compose.yml down' to stop${NC}"
fi 