#!/bin/bash

# OpenRCT2 Bingo Development Server Manager
# This script watches for changes to the plugin file and restarts the OpenRCT2 server

PLUGIN_FILE="$HOME/.config/OpenRCT2/plugin/bingo.js"
SCENARIO_FILE="$HOME/.config/OpenRCT2/scenario/bingothon-map.park"
PORT="11753"
SERVER_PID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages with colors
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"
}

# Function to check if OpenRCT2 is running
is_server_running() {
    if [ ! -z "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to start the OpenRCT2 server
start_server() {
    log "Starting OpenRCT2 server..."
    
    # Check if scenario file exists
    if [ ! -f "$SCENARIO_FILE" ]; then
        log_warning "Scenario file not found: $SCENARIO_FILE"
        log "Please ensure you have a scenario file at this location"
        return 1
    fi
    
    # Kill any existing OpenRCT2 processes on the same port
    pkill -f "openrct2 host.*$PORT" 2>/dev/null || true
    sleep 1
    
    # Start OpenRCT2 in headless mode
    openrct2 host "$SCENARIO_FILE" --headless --port "$PORT" &
    SERVER_PID=$!
    
    # Wait a moment to see if the server started successfully
    sleep 2
    if is_server_running; then
        log_success "OpenRCT2 server started (PID: $SERVER_PID) on port $PORT"
        return 0
    else
        log_error "Failed to start OpenRCT2 server"
        return 1
    fi
}

# Function to restart the OpenRCT2 server
restart_server() {
    log "Restarting OpenRCT2 server..."
    
    # Stop the server if it's running
    if is_server_running; then
        log "Stopping current server (PID: $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
        SERVER_PID=""
    fi
    
    # Start the server again
    start_server
}

# Function to stop the OpenRCT2 server
stop_server() {
    if is_server_running; then
        log "Stopping OpenRCT2 server (PID: $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
        SERVER_PID=""
        log_success "Server stopped"
    else
        log "No server running"
    fi
}

# Function to handle cleanup on exit
cleanup() {
    log "Shutting down development server..."
    stop_server
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main function
main() {
    log "OpenRCT2 Bingo Development Server Manager"
    log "Watching: $PLUGIN_FILE"
    log "Scenario: $SCENARIO_FILE"
    log "Port: $PORT"
    echo
    
    # Check if plugin file exists
    if [ ! -f "$PLUGIN_FILE" ]; then
        log_error "Plugin file not found: $PLUGIN_FILE"
        log "Please run 'npm run build:dev' first to create the plugin file"
        exit 1
    fi
    
    # Start the server initially
    start_server
    if [ $? -ne 0 ]; then
        exit 1
    fi
    
    log "Development server is running. Press Ctrl+C to stop."
    echo
    
    # Watch for changes to the plugin file
    inotifywait -m -e modify,create,close_write "$PLUGIN_FILE" 2>/dev/null | while read path action file; do
        log "Plugin file changed, restarting server..."
        restart_server
    done
}

# Check if inotifywait is available
if ! command -v inotifywait &> /dev/null; then
    log_error "inotifywait is not installed. Please install it:"
    log "  Ubuntu/Debian: sudo apt-get install inotify-tools"
    log "  Arch: sudo pacman -S inotify-tools"
    log "  Fedora: sudo dnf install inotify-tools"
    exit 1
fi

# Check if OpenRCT2 is available
if ! command -v openrct2 &> /dev/null; then
    log_error "OpenRCT2 is not installed or not in PATH"
    exit 1
fi

# Run the main function
main
