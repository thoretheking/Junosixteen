# 🚀 JunoSixteen Mangle System Starter (PowerShell)
param(
    [switch]$Docker,
    [switch]$SkipDeps,
    [switch]$Test,
    [switch]$Help
)

# Colors für PowerShell
$Red = "Red"
$Green = "Green"  
$Yellow = "Yellow"
$Blue = "Cyan"

if ($Help) {
    Write-Host "Usage: .\start-mangle-system.ps1 [OPTIONS]" -ForegroundColor $Blue
    Write-Host "Options:"
    Write-Host "  -Docker     Use Docker Compose instead of local services"
    Write-Host "  -SkipDeps   Skip dependency installation"
    Write-Host "  -Test       Run integration tests after startup"
    Write-Host "  -Help       Show this help message"
    exit 0
}

Write-Host "🚀 Starting JunoSixteen Mangle System..." -ForegroundColor $Blue
Write-Host "Project root: $(Get-Location)" -ForegroundColor $Blue

# Configuration
$ManglePort = 8088
$BackendPort = 5000

# Function to check if port is in use
function Test-Port {
    param($Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    } catch {
        return $false
    }
}

# Function to wait for service
function Wait-ForService {
    param($Url, $Name, $MaxAttempts = 30)
    
    Write-Host "⏳ Waiting for $Name to be ready..." -ForegroundColor $Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec 3 -ErrorAction Stop
            Write-Host "✅ $Name is ready!" -ForegroundColor $Green
            return $true
        } catch {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
        }
    }
    
    Write-Host ""
    Write-Host "❌ $Name failed to start after $MaxAttempts seconds" -ForegroundColor $Red
    return $false
}

# Cleanup function
function Stop-Services {
    Write-Host "🧹 Stopping services..." -ForegroundColor $Yellow
    
    # Stop any running Node.js processes on our port
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue | Where-Object LocalPort -eq $BackendPort)
    } | Stop-Process -Force
    
    # Stop any Go processes
    Get-Process -Name "main" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "mangle-svc" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "✅ Services stopped" -ForegroundColor $Green
}

# Set cleanup trap
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Stop-Services }

try {
    if ($Docker) {
        Write-Host "🐳 Starting with Docker Compose..." -ForegroundColor $Blue
        
        if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
            Write-Host "❌ docker-compose is not installed" -ForegroundColor $Red
            exit 1
        }
        
        Set-Location infra
        docker-compose up -d --build
        
        if (-not (Wait-ForService "http://localhost:$ManglePort/health" "Mangle Service")) { exit 1 }
        if (-not (Wait-ForService "http://localhost:$BackendPort/health" "Backend API")) { exit 1 }
        
        Write-Host "🎉 Docker services are running!" -ForegroundColor $Green
        
    } else {
        Write-Host "🏠 Starting locally..." -ForegroundColor $Blue
        
        # Check ports
        if (Test-Port $ManglePort) {
            Write-Host "⚠️ Port $ManglePort is already in use" -ForegroundColor $Yellow
        }
        if (Test-Port $BackendPort) {
            Write-Host "⚠️ Port $BackendPort is already in use" -ForegroundColor $Yellow
        }
        
        # Install dependencies
        if (-not $SkipDeps) {
            Write-Host "📦 Installing dependencies..." -ForegroundColor $Yellow
            
            # Backend dependencies
            Write-Host "Installing Node.js dependencies..."
            Set-Location backend
            npm install
            Set-Location ..
            
            # Go dependencies
            Write-Host "Installing Go dependencies..."
            Set-Location services/mangle
            if (Get-Command go -ErrorAction SilentlyContinue) {
                go mod download
                go mod verify
            } else {
                Write-Host "⚠️ Go not found - skipping Go dependencies" -ForegroundColor $Yellow
            }
            Set-Location ../..
            
            Write-Host "✅ Dependencies installed" -ForegroundColor $Green
        }
        
        # Start Mangle service
        Write-Host "🚀 Starting Mangle service..." -ForegroundColor $Yellow
        Set-Location services/mangle
        
        if (Get-Command go -ErrorAction SilentlyContinue) {
            $env:MANGLE_FAKE = "1"
            $env:PORT = $ManglePort.ToString()
            
            if (-not (Test-Path "mangle-svc.exe")) {
                Write-Host "Building Mangle service..."
                go build -o mangle-svc.exe .
            }
            
            $mangleJob = Start-Job -ScriptBlock {
                param($WorkingDir, $Port)
                Set-Location $WorkingDir
                $env:MANGLE_FAKE = "1"
                $env:PORT = $Port
                .\mangle-svc.exe
            } -ArgumentList (Get-Location), $ManglePort
            
            Set-Location ../..
            
            if (-not (Wait-ForService "http://localhost:$ManglePort/health" "Mangle Service")) {
                Stop-Job $mangleJob -PassThru | Remove-Job
                exit 1
            }
        } else {
            Write-Host "⚠️ Go not available - Mangle service will not start" -ForegroundColor $Yellow
            Set-Location ../..
        }
        
        # Start Backend
        Write-Host "🚀 Starting Backend API..." -ForegroundColor $Yellow
        Set-Location backend
        
        $env:PORT = $BackendPort.ToString()
        $env:MANGLE_URL = "http://localhost:$ManglePort"
        $env:NODE_ENV = "development"
        
        $backendJob = Start-Job -ScriptBlock {
            param($WorkingDir, $Port, $MangleUrl)
            Set-Location $WorkingDir
            $env:PORT = $Port
            $env:MANGLE_URL = $MangleUrl
            $env:NODE_ENV = "development"
            node server.js
        } -ArgumentList (Get-Location), $BackendPort, "http://localhost:$ManglePort"
        
        Set-Location ..
        
        if (-not (Wait-ForService "http://localhost:$BackendPort/health" "Backend API")) {
            Stop-Job $backendJob -PassThru | Remove-Job
            if ($mangleJob) { Stop-Job $mangleJob -PassThru | Remove-Job }
            exit 1
        }
        
        Write-Host "🎉 Local services are running!" -ForegroundColor $Green
    }
    
    # Show service status
    Write-Host "📊 Service Status:" -ForegroundColor $Blue
    Write-Host "  🔧 Mangle Service: http://localhost:$ManglePort"
    Write-Host "  🌐 Backend API: http://localhost:$BackendPort"
    Write-Host "  📋 API Docs: http://localhost:$BackendPort/api/policy/info"
    Write-Host ""
    
    # Run integration tests if requested
    if ($Test) {
        Write-Host "🧪 Running integration tests..." -ForegroundColor $Yellow
        
        # Test health endpoints
        Write-Host "Testing health endpoints..."
        try {
            Invoke-RestMethod -Uri "http://localhost:$ManglePort/health" -TimeoutSec 5 | Out-Null
            Invoke-RestMethod -Uri "http://localhost:$BackendPort/health" -TimeoutSec 5 | Out-Null
            Write-Host "✅ Health checks passed" -ForegroundColor $Green
        } catch {
            Write-Host "❌ Health checks failed: $($_.Exception.Message)" -ForegroundColor $Red
        }
        
        # Test "Warum?" endpoint
        Write-Host "Testing 'Warum?' endpoint..."
        try {
            $whyResponse = Invoke-RestMethod -Uri "http://localhost:$BackendPort/api/policy/why" `
                -Method POST -ContentType "application/json" `
                -Body '{"userId":"lea", "level":3}' -TimeoutSec 10
            
            if ($whyResponse.summary -and $whyResponse.causes) {
                Write-Host "✅ 'Warum?' endpoint working" -ForegroundColor $Green
            } else {
                Write-Host "⚠️ 'Warum?' endpoint returned unexpected format" -ForegroundColor $Yellow
            }
        } catch {
            Write-Host "❌ 'Warum?' endpoint failed: $($_.Exception.Message)" -ForegroundColor $Red
        }
        
        # Test Leaderboard endpoints
        Write-Host "Testing Leaderboard endpoints..."
        try {
            $leaderboardResponse = Invoke-RestMethod -Uri "http://localhost:$BackendPort/api/leaderboard/individual/weekly" -TimeoutSec 10
            
            if ($leaderboardResponse.leaderboard) {
                Write-Host "✅ Leaderboard endpoints working" -ForegroundColor $Green
            } else {
                Write-Host "⚠️ Leaderboard returned unexpected format" -ForegroundColor $Yellow
            }
        } catch {
            Write-Host "❌ Leaderboard endpoint failed: $($_.Exception.Message)" -ForegroundColor $Red
        }
        
        Write-Host "🎉 Integration tests completed!" -ForegroundColor $Green
    }
    
    # Show useful commands
    Write-Host "💡 Useful Commands:" -ForegroundColor $Blue
    Write-Host "  Test 'Warum?' endpoint:"
    Write-Host "    Invoke-RestMethod -Uri 'http://localhost:$BackendPort/api/policy/why' -Method POST -ContentType 'application/json' -Body '{\"userId\":\"lea\", \"level\":3}'"
    Write-Host ""
    Write-Host "  Test Leaderboard:"
    Write-Host "    Invoke-RestMethod -Uri 'http://localhost:$BackendPort/api/leaderboard/individual/weekly'"
    Write-Host ""
    Write-Host "  Stop services: Ctrl+C"
    Write-Host ""
    
    if (-not $Docker) {
        Write-Host "🎯 Services are running in background jobs" -ForegroundColor $Green
        Write-Host "Press Ctrl+C to stop all services" -ForegroundColor $Blue
        
        # Keep script running
        try {
            while ($true) {
                Start-Sleep -Seconds 1
            }
        } catch {
            # Ctrl+C pressed
        }
    } else {
        Write-Host "🐳 Docker services are running" -ForegroundColor $Green
        Write-Host "Use 'docker-compose -f infra/docker-compose.yml down' to stop" -ForegroundColor $Blue
    }
    
} finally {
    Stop-Services
} 