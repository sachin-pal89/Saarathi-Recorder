@echo off
echo 🚀 Starting Saarathi Recorder Development Environment...

REM Check if .env files exist
if not exist "frontend\.env.local" (
    echo ⚠️  Frontend .env.local not found. Please copy frontend\env.example to frontend\.env.local and configure your Supabase credentials.
    pause
    exit /b 1
)

if not exist "backend\.env" (
    echo ⚠️  Backend .env not found. Please copy backend\env.example to backend\.env and configure your Supabase credentials.
    pause
    exit /b 1
)

echo 🔧 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

echo 🎨 Starting frontend development server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ✅ Development servers started!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:3001
echo.
echo Press any key to exit...
pause > nul


