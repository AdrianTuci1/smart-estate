#!/bin/bash

# Script to start both frontend and backend in development mode

echo "🚀 Starting Smart Estate Development Environment..."

# Check if we're in the right directory
if [ ! -d "estate-backend" ] || [ ! -d "estate-app" ]; then
    echo "❌ Error: Please run this script from the smart-estate root directory"
    exit 1
fi

# Function to start backend
start_backend() {
    echo "📦 Starting backend server..."
    cd estate-backend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing backend dependencies..."
        npm install
    fi
    
    # Start backend in background
    npm run dev &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend application..."
    cd estate-app
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend
    npm run dev
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID"
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start services
start_backend

# Wait a moment for backend to start
sleep 3

start_frontend

# Wait for user to stop
wait
