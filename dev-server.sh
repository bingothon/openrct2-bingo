#!/bin/bash

# OpenRCT2 Bingo Development Server Manager
# This script watches for changes to the plugin file and restarts the OpenRCT2 server
# Usage: ./dev-server.sh [--headless|--no-headless]

PLUGIN_FILE="$HOME/.config/OpenRCT2/plugin/bingo.js"
SCENARIO_FILE="$HOME/.config/OpenRCT2/scenario/bingothon-map.park"
PORT="11753"
# OpenRCT2 to run: OPENRCT2_BIN, else the newest AppImage in ~/Downloads, else "openrct2" from PATH
OPENRCT2_BIN="${OPENRCT2_BIN:-$(ls -1 "$HOME"/Downloads/OpenRCT2-v*-linux-x86_64.AppImage 2>/dev/null | sort -V | tail -n 1)}"
OPENRCT2_BIN="${OPENRCT2_BIN:-openrct2}"
# Matches this dev server's OpenRCT2 process (installed binary or AppImage) and nothing else
PROCESS_PATTERN="[Oo]pen[Rr][Cc][Tt]2.* host .*--port $PORT"
SERVER_PID=""
HEADLESS_MODE="true"  # Default to headless mode

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
    log "Ensuring port $PORT is free..."
    pkill -f "$PROCESS_PATTERN" 2>/dev/null || true
    sleep 2
    pkill -9 -f "$PROCESS_PATTERN" 2>/dev/null || true
    sleep 1
    
    # Verify port is actually free
    local port_check_count=0
    while [ $port_check_count -lt 5 ]; do
        local remaining_processes=$(pgrep -f "$PROCESS_PATTERN" 2>/dev/null | wc -l)
        if [ "$remaining_processes" -eq 0 ]; then
            log "Port $PORT is free"
            break
        else
            log "Port $PORT still has $remaining_processes processes, waiting..."
            sleep 1
            port_check_count=$((port_check_count + 1))
        fi
    done
    
    # Build the command based on headless mode
    if [ "$HEADLESS_MODE" = "true" ]; then
        log "Starting in headless mode"
        "$OPENRCT2_BIN" host "$SCENARIO_FILE" --headless --port "$PORT" &
    else
        log "Starting with GUI"
        "$OPENRCT2_BIN" host "$SCENARIO_FILE" --port "$PORT" &
    fi
    SERVER_PID=$!
    
    # Wait a moment to see if the server started successfully
    sleep 3
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
        local current_pid="$SERVER_PID"
        
        # Send first SIGINT (like first Ctrl+C)
        kill -INT "$current_pid" 2>/dev/null || true
        sleep 2
        
        # Check if still running and send second SIGINT
        if kill -0 "$current_pid" 2>/dev/null; then
            log "Process still running, sending second SIGINT..."
            kill -INT "$current_pid" 2>/dev/null || true
            sleep 2
        fi
        
        # Force kill if still running
        if kill -0 "$current_pid" 2>/dev/null; then
            log "Process still running, force killing..."
            kill -KILL "$current_pid" 2>/dev/null || true
            sleep 1
        fi
        
        # Wait for the process to actually terminate
        log "Waiting for process to terminate..."
        local wait_count=0
        while kill -0 "$current_pid" 2>/dev/null && [ $wait_count -lt 10 ]; do
            sleep 1
            wait_count=$((wait_count + 1))
            log "Still waiting for PID $current_pid to terminate... ($wait_count/10)"
        done
        
        # Clear the PID
        SERVER_PID=""
        
        # Additional cleanup for any remaining OpenRCT2 processes
        log "Cleaning up any remaining OpenRCT2 processes on port $PORT..."
        pkill -f "$PROCESS_PATTERN" 2>/dev/null || true
        sleep 2
        pkill -9 -f "$PROCESS_PATTERN" 2>/dev/null || true
        sleep 1
        
        log "Server shutdown complete"
    fi
    
    # Start the server again
    start_server
}

# Function to stop the OpenRCT2 server
stop_server() {
    if is_server_running; then
        log "Stopping OpenRCT2 server (PID: $SERVER_PID)..."
        local current_pid="$SERVER_PID"
        
        # Send first SIGINT (like first Ctrl+C)
        kill -INT "$current_pid" 2>/dev/null || true
        sleep 2
        
        # Check if still running and send second SIGINT
        if kill -0 "$current_pid" 2>/dev/null; then
            log "Process still running, sending second SIGINT..."
            kill -INT "$current_pid" 2>/dev/null || true
            sleep 2
        fi
        
        # Force kill if still running
        if kill -0 "$current_pid" 2>/dev/null; then
            log "Process still running, force killing..."
            kill -KILL "$current_pid" 2>/dev/null || true
            sleep 1
        fi
        
        # Wait for the process to actually terminate
        log "Waiting for process to terminate..."
        local wait_count=0
        while kill -0 "$current_pid" 2>/dev/null && [ $wait_count -lt 10 ]; do
            sleep 1
            wait_count=$((wait_count + 1))
            log "Still waiting for PID $current_pid to terminate... ($wait_count/10)"
        done
        
        # Clear the PID
        SERVER_PID=""
    fi
    
    # Nuclear option: kill any remaining openrct2 processes on our port
    log "Cleaning up any remaining OpenRCT2 processes on port $PORT..."
    pkill -f "$PROCESS_PATTERN" 2>/dev/null || true
    sleep 2
    pkill -9 -f "$PROCESS_PATTERN" 2>/dev/null || true
    sleep 1
    
    # Final verification - check if any OpenRCT2 processes are still running on our port
    local remaining_processes=$(pgrep -f "$PROCESS_PATTERN" 2>/dev/null | wc -l)
    if [ "$remaining_processes" -gt 0 ]; then
        log_warning "Warning: $remaining_processes OpenRCT2 processes may still be running on port $PORT"
    else
        log_success "All OpenRCT2 processes on port $PORT have been terminated"
    fi
}

# Function to handle cleanup on exit
cleanup() {
    log "Shutting down development server..."
    
    # Cancel any pending restart timer
    if [ ! -z "$RESTART_TIMER" ]; then
        log "Cancelling pending restart..."
        kill "$RESTART_TIMER" 2>/dev/null || true
    fi
    
    stop_server
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --headless)
                HEADLESS_MODE="true"
                shift
                ;;
            --no-headless)
                HEADLESS_MODE="false"
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [--headless|--no-headless]"
                echo "  --headless     Start OpenRCT2 in headless mode (default)"
                echo "  --no-headless  Start OpenRCT2 with GUI"
                echo "  --help, -h     Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                log "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    log "OpenRCT2 Bingo Development Server Manager"
    log "Watching: $PLUGIN_FILE"
    log "Scenario: $SCENARIO_FILE"
    log "Port: $PORT"
    log "OpenRCT2: $OPENRCT2_BIN ($("$OPENRCT2_BIN" --version 2>/dev/null | head -n 1))"
    log "Mode: $([ "$HEADLESS_MODE" = "true" ] && echo "Headless" || echo "GUI")"
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
    
    # Watch for changes to the plugin file with debouncing
    # This prevents multiple restarts when files change rapidly
    RESTART_DELAY=2  # Wait 2 seconds after last change before restarting
    RESTART_TIMER=""
    
    inotifywait -m -e modify,create,close_write "$PLUGIN_FILE" 2>/dev/null | while read path action file; do
        log "Plugin file changed, scheduling restart in ${RESTART_DELAY}s..."
        
        # Cancel any existing restart timer
        if [ ! -z "$RESTART_TIMER" ]; then
            kill "$RESTART_TIMER" 2>/dev/null || true
        fi
        
        # Set a new timer for restart
        (
            sleep "$RESTART_DELAY"
            log "Restarting server after file changes settled..."
            restart_server
        ) &
        RESTART_TIMER=$!
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

# Parse command line arguments first
parse_args "$@"

# Run the main function
main


