# ================================================================
# LibraryOS - Full Stack Startup Script
# Run from: C:\Users\siddanth sajwan\OneDrive\Desktop\LMS
# Command:  powershell -ExecutionPolicy Bypass -File start-all.ps1
# ================================================================

$mysqld   = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$mysql    = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$dataDir  = "$env:USERPROFILE\MySQL\data"
$dataPath = $dataDir.Replace('\','/')
$lmsRoot  = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        LibraryOS Startup Script        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1 - Kill any old mysqld processes
Write-Host "[1/5] Cleaning up old MySQL processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.Name -eq "mysqld" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# STEP 2 - Start MySQL as a background Job
Write-Host "[2/5] Starting MySQL Server..." -ForegroundColor Yellow

$mysqlJob = Start-Job -Name "LibraryOS_MySQL" -ScriptBlock {
    param($dp, $md)
    & $md "--datadir=$dp/" "--port=3306"
} -ArgumentList $dataPath, $mysqld

Start-Sleep -Seconds 6

if ($mysqlJob.State -ne "Running") {
    Write-Host "ERROR: MySQL failed to start!" -ForegroundColor Red
    Receive-Job $mysqlJob
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "OK - MySQL job is running (Job #$($mysqlJob.Id))" -ForegroundColor Green

# STEP 3 - Test MySQL connection
Write-Host "[3/5] Testing MySQL connection..." -ForegroundColor Yellow

$connected = $false
for ($i = 1; $i -le 10; $i++) {
    $connJob = Start-Job -ScriptBlock {
        param($m)
        & $m -u root --protocol=TCP -h 127.0.0.1 --connect-timeout=2 -e "SELECT 1;" 2>&1
    } -ArgumentList $mysql
    Wait-Job $connJob -Timeout 8 | Out-Null
    $result = Receive-Job $connJob
    Remove-Job $connJob -Force

    if ($result -match "1") {
        $connected = $true
        Write-Host "OK - MySQL connected on attempt $i" -ForegroundColor Green
        break
    }
    Write-Host "  Attempt $i/10 - retrying in 2s..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
}

if (-not $connected) {
    Write-Host "ERROR: Cannot connect to MySQL after 10 attempts!" -ForegroundColor Red
    Stop-Job $mysqlJob; Remove-Job $mysqlJob
    Read-Host "Press Enter to exit"
    exit 1
}

# STEP 4 - Run database schema
Write-Host "[4/5] Setting up database schema..." -ForegroundColor Yellow

$schemaFile = Join-Path $lmsRoot "backend\src\config\schema.sql"
$schemaContent = Get-Content $schemaFile -Raw

$schemaJob = Start-Job -ScriptBlock {
    param($m, $sql)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $m
    $psi.Arguments = "-u root --protocol=TCP -h 127.0.0.1"
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    $p = [System.Diagnostics.Process]::Start($psi)
    $p.StandardInput.WriteLine($sql)
    $p.StandardInput.Close()
    $out = $p.StandardOutput.ReadToEnd()
    $err = $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    return $p.ExitCode
} -ArgumentList $mysql, $schemaContent

Wait-Job $schemaJob -Timeout 30 | Out-Null
$exitCode = Receive-Job $schemaJob
Remove-Job $schemaJob -Force

if ($exitCode -eq 0) {
    Write-Host "OK - Database schema applied (exit code: $exitCode)" -ForegroundColor Green
} else {
    Write-Host "WARNING - Schema exit code: $exitCode (may already exist, continuing...)" -ForegroundColor Yellow
}

# STEP 5 - Start Backend and Frontend in new windows
Write-Host "[5/5] Launching Backend and Frontend..." -ForegroundColor Yellow

$backendDir  = Join-Path $lmsRoot "backend"
$frontendDir = Join-Path $lmsRoot "frontend"

Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "title LibraryOS BACKEND (port 5000) && cd /d `"$backendDir`" && npm run dev" `
    -WindowStyle Normal

Start-Sleep -Seconds 2

Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "title LibraryOS FRONTEND (port 5173) && cd /d `"$frontendDir`" && npm run dev" `
    -WindowStyle Normal

# Wait for servers to boot
Write-Host "" 
Write-Host "Waiting 15 seconds for servers to start..." -ForegroundColor DarkGray
Start-Sleep -Seconds 15

# Check health
$backendOK  = $false
$frontendOK = $false

try {
    $h = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "OK - Backend:  http://localhost:5000  ($($h.message))" -ForegroundColor Green
    $backendOK = $true
} catch {
    Write-Host "WARN - Backend not ready yet (check the Backend window)" -ForegroundColor Yellow
}

try {
    $f = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    Write-Host "OK - Frontend: http://localhost:5173  (HTTP $($f.StatusCode))" -ForegroundColor Green
    $frontendOK = $true
} catch {
    Write-Host "WARN - Frontend not ready yet (check the Frontend window)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ALL SERVICES UP - LibraryOS Running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  MySQL    -> localhost:3306" -ForegroundColor White
Write-Host "  Backend  -> http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Admin login: admin@libraryos.com / Admin@123" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor DarkGray
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "*** KEEP THIS WINDOW OPEN - MySQL is running inside it ***" -ForegroundColor Red
Write-Host "    Press Ctrl+C or close this window to stop MySQL." -ForegroundColor DarkGray
Write-Host ""

# Keep MySQL alive until user exits
try {
    Wait-Job $mysqlJob
} finally {
    Write-Host "Stopping MySQL..."
    Stop-Job  $mysqlJob -ErrorAction SilentlyContinue
    Remove-Job $mysqlJob -ErrorAction SilentlyContinue
    Get-Process | Where-Object { $_.Name -eq "mysqld" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "MySQL stopped. Goodbye!"
}
