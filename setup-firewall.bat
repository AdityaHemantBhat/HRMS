@echo off
echo ========================================
echo  Adding Windows Firewall Rules
echo  for HRMS Development Server
echo ========================================
echo.

echo Adding rule for Node.js Backend (Port 5000)...
netsh advfirewall firewall add rule name="HRMS Backend - Node.js" dir=in action=allow protocol=TCP localport=5000

echo.
echo Adding rule for React Frontend (Port 3000)...
netsh advfirewall firewall add rule name="HRMS Frontend - React" dir=in action=allow protocol=TCP localport=3000

echo.
echo ========================================
echo  ✅ Firewall rules added successfully!
echo ========================================
echo.
echo You can now access the app from your mobile:
echo   Frontend: http://192.168.1.2:3000
echo   Backend:  http://192.168.1.2:5000
echo.
echo Make sure both devices are on the same WiFi!
echo.
pause
