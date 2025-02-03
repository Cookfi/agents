#!/bin/bash

echo "Ensuring port 3000 is free..."
# Try both methods to ensure the port is free
sudo fuser -k 3000/tcp 2>/dev/null || sudo lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the script in the background
pnpm start:debug --character="../characters/dobby.character.json" > run.log 2>&1 &

# Extract the process ID (PID)
PID=$!

echo $PID > script.pid

# Output the PID for reference
echo "Script started with PID: $PID"
