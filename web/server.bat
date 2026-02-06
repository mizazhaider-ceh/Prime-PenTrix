@echo off
setlocal EnableDelayedExpansion
title Sentinel V3 - Server Manager
color 0A

:MENU
cls
echo.
echo ========================================
echo   SENTINEL V3 - SERVER MANAGER
echo ========================================
echo.
echo [1] Start Server
echo [2] Stop Server
echo [3] Restart Server
echo [4] Check Status
echo [5] Clean Cache
echo [6] Database Generate
echo [7] Database Push
echo [8] Database Seed
echo [9] Install Dependencies
echo [0] Exit
echo.
echo ========================================
echo.

set /p choice="Select option (0-9): "

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto RESTART
if "%choice%"=="4" goto STATUS
if "%choice%"=="5" goto CLEAN
if "%choice%"=="6" goto DB_GENERATE
if "%choice%"=="7" goto DB_PUSH
if "%choice%"=="8" goto DB_SEED
if "%choice%"=="9" goto INSTALL
if "%choice%"=="0" goto EXIT

echo Invalid choice!
timeout /t 2 >nul
goto MENU

:START
cls
echo.
echo ========================================
echo   STARTING SERVER
echo ========================================
echo.
echo Checking for existing processes...

REM Check if node is already running on port 3000
netstat -ano | findstr :3000 >nul 2>&1
if !errorlevel! equ 0 (
    echo.
    echo [!] Port 3000 is already in use!
    echo.
    choice /C YN /M "Stop existing process and start new one"
    if !errorlevel! equ 1 (
        call :STOP_PROCESSES
        timeout /t 2 >nul
    ) else (
        goto MENU
    )
)

echo Starting development server...
echo.
echo Server will start on: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
npm run dev
goto MENU

:STOP
cls
echo.
echo ========================================
echo   STOPPING SERVER
echo ========================================
echo.
call :STOP_PROCESSES
echo.
echo Done!
timeout /t 2 >nul
goto MENU

:RESTART
cls
echo.
echo ========================================
echo   RESTARTING SERVER
echo ========================================
echo.
echo Stopping existing processes...
call :STOP_PROCESSES
echo.
echo Waiting for cleanup...
timeout /t 3 /nobreak >nul
echo.
echo Starting server...
echo.
npm run dev
goto MENU

:STATUS
cls
echo.
echo ========================================
echo   SERVER STATUS
echo ========================================
echo.

REM Check Node.js processes
echo Checking Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul 2>&1
if !errorlevel! equ 0 (
    echo [✓] Node.js processes found:
    tasklist /FI "IMAGENAME eq node.exe" | findstr node.exe
) else (
    echo [✗] No Node.js processes running
)

echo.
echo Checking port 3000...
netstat -ano | findstr :3000 >nul 2>&1
if !errorlevel! equ 0 (
    echo [✓] Port 3000 is in use:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        set PID=%%a
        echo     PID: !PID!
        for /f "tokens=1" %%b in ('tasklist /FI "PID eq !PID!" ^| findstr !PID!') do (
            echo     Process: %%b
        )
    )
) else (
    echo [✗] Port 3000 is available
)

echo.
echo Checking lock file...
if exist ".next\dev\lock" (
    echo [!] Lock file exists: .next\dev\lock
) else (
    echo [✓] No lock file found
)

echo.
echo Environment:
if exist ".env.local" (
    echo [✓] .env.local exists
) else (
    echo [✗] .env.local missing
)

if exist "node_modules" (
    echo [✓] node_modules exists
) else (
    echo [✗] node_modules missing - run option 9
)

echo.
pause
goto MENU

:CLEAN
cls
echo.
echo ========================================
echo   CLEANING CACHE
echo ========================================
echo.

echo Stopping processes...
call :STOP_PROCESSES

echo.
echo Removing .next directory...
if exist ".next" (
    rmdir /s /q ".next" 2>nul
    echo [✓] .next directory removed
) else (
    echo [i] .next directory not found
)

echo.
echo Removing lock files...
if exist ".next\dev\lock" (
    del /f /q ".next\dev\lock" 2>nul
    echo [✓] Lock file removed
)

echo.
echo Cache cleaned successfully!
timeout /t 2 >nul
goto MENU

:DB_GENERATE
cls
echo.
echo ========================================
echo   GENERATING PRISMA CLIENT
echo ========================================
echo.
npm run db:generate
echo.
pause
goto MENU

:DB_PUSH
cls
echo.
echo ========================================
echo   PUSHING DATABASE SCHEMA
echo ========================================
echo.
npm run db:push
echo.
pause
goto MENU

:DB_SEED
cls
echo.
echo ========================================
echo   SEEDING DATABASE
echo ========================================
echo.
npm run db:seed
echo.
pause
goto MENU

:INSTALL
cls
echo.
echo ========================================
echo   INSTALLING DEPENDENCIES
echo ========================================
echo.
npm install
echo.
pause
goto MENU

:STOP_PROCESSES
echo Checking for Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul 2>&1
if !errorlevel! equ 0 (
    echo Terminating Node.js processes...
    taskkill /F /IM node.exe >nul 2>&1
    if !errorlevel! equ 0 (
        echo [✓] Node.js processes terminated
    ) else (
        echo [!] Failed to terminate some processes
    )
) else (
    echo [i] No Node.js processes found
)

if exist ".next\dev\lock" (
    echo Removing lock file...
    del /f /q ".next\dev\lock" >nul 2>&1
    echo [✓] Lock file removed
)
goto :EOF

:EXIT
cls
echo.
echo ========================================
echo   Goodbye!
echo ========================================
echo.
timeout /t 1 >nul
exit /b 0
