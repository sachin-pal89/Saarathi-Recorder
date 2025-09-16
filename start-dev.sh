#!/bin/bash

# Saarathi Recorder Development Startup Script

echo "🚀 Starting Saarathi Recorder Development Environment..."

# Check if .env files exist
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Frontend .env.local not found. Please copy frontend/env.example to frontend/.env.local and configure your Supabase credentials."
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env not found. Please copy backend/env.example to backend/.env and configure your Supabase credentials."
    exit 1
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait

# Cleanup on exit
echo "🛑 Stopping servers..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "✅ Servers stopped"


