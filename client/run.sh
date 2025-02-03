#!/bin/bash

echo "Ensuring port 4173 is free..."
# Try both methods to ensure the port is free
sudo fuser -k 4173/tcp 2>/dev/null || sudo lsof -ti:4173 | xargs kill -9 2>/dev/null || true

echo "Building for production..."
# Build the application first
pnpm build

# Start the preview server in the background
pnpm preview > run.log 2>&1 &

# Extract the process ID (PID)
PID=$!

echo $PID > script.pid

# Output the PID for reference
echo "Script started with PID: $PID" 