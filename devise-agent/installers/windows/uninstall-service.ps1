# Devise Desktop Agent - Windows Service Uninstall
# Run as Administrator

$ServiceName = "DeviseAgent"

# Check if service exists
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($service) {
    # Stop the service
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Write-Host "Service stopped"
    
    # Delete the service
    sc.exe delete $ServiceName
    Write-Host "Service deleted"
    
    Write-Host "Devise Agent service uninstalled successfully"
} else {
    Write-Host "Service '$ServiceName' not found"
}

# Optional: Remove config directory
# Remove-Item -Path "C:\ProgramData\Devise" -Recurse -Force -ErrorAction SilentlyContinue
