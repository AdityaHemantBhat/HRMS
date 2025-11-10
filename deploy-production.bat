@echo off
echo ========================================
echo   TalentSphere HRMS Production Build
echo ========================================
echo.

echo [1/5] Checking environment...
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

echo [2/5] Installing dependencies...
call npm install --production
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [3/5] Running database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo ERROR: Database migration failed
    pause
    exit /b 1
)

echo [4/5] Building frontend...
cd client
call npm install
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
cd ..

echo [5/5] Production build complete!
echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo 1. Review PRODUCTION_CHECKLIST.md
echo 2. Change default admin password
echo 3. Configure production environment
echo 4. Start server: npm start
echo ========================================
echo.
pause
