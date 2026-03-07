# Devise Desktop Agent - Windows Service Setup
# Run as Administrator

# Configuration
$ServiceName = "DeviseAgent"
$DisplayName = "Devise Desktop Agent"
$Description = "Enterprise AI Governance - Desktop Detection Agent"
$ExePath = "$PSScriptRoot\devise-agent.exe"
$ConfigPath = "C:\ProgramData\Devise\config.json"

# Create config directory if not exists
if (!(Test-Path "C:\ProgramData\Devise")) {
    New-Item -ItemType Directory -Path "C:\ProgramData\Devise" -Force
}

# Create default config if not exists
if (!(Test-Path $ConfigPath)) {
    @{
        api_key = "YOUR-API-KEY-HERE"
        backend_url = "https://api.devise.example.com"
        device_id = ""
        identity = @{
            user_id = ""
            user_email = ""
            department = ""
        }
        poll_interval = 30
        deduplication_window = 300
    } | ConvertTo-Json | Set-Content $ConfigPath
}

# Check if service exists
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($service) {
    # Stop and remove existing service
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $ServiceName
    Start-Sleep -Seconds 2
}

# Create new service using NSSM (if available) or sc.exe
# Using sc.exe for built-in service creation
$binPath = "`"$ExePath`" --config `"$ConfigPath`""

# Create service with sc.exe
New-Service -Name $ServiceName `
    -BinaryPathName $binPath `
    -DisplayName $DisplayName `
    -Description $Description `
    -StartupType Automatic `
    -ErrorAction Stop

# Set service to restart on failure
sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000

# Start the service
Start-Service -Name $ServiceName

Write-Host "Devise Agent service installed and started successfully"
Get-Service -Name $ServiceName | Select-Object Status, StartType, DisplayName
