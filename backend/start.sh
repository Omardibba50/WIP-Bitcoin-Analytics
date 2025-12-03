#!/bin/bash

# Railway startup script for BTC Analytics Backend
echo "Starting BTC Analytics Backend..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting server..."
npm start
