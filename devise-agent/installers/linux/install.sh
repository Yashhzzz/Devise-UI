#!/usr/bin/env bash
set -euo pipefail

BINARY_NAME="devise-agent"
INSTALL_DIR="/opt/devise-agent"
CONFIG_DIR="/etc/devise"
SERVICE_FILE="devise-agent.service"

echo "Installing Devise Desktop Agent..."

# Check root
if [[ $EUID -ne 0 ]]; then
    echo "Error: must run as root" >&2
    exit 1
fi

# Install binary
mkdir -p "$INSTALL_DIR"
cp "$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
chmod 755 "$INSTALL_DIR/$BINARY_NAME"

# Create config dir
mkdir -p "$CONFIG_DIR"
if [[ ! -f "$CONFIG_DIR/config.json" ]]; then
    echo '{"api_key": "", "backend_url": "https://api.devise.ai"}' > "$CONFIG_DIR/config.json"
    chmod 600 "$CONFIG_DIR/config.json"
fi

# Install systemd service
cp "$SERVICE_FILE" "/etc/systemd/system/$SERVICE_FILE"
chmod 644 "/etc/systemd/system/$SERVICE_FILE"

# Enable and start
systemctl daemon-reload
systemctl enable "$SERVICE_FILE"
systemctl start "$SERVICE_FILE"

if systemctl is-active --quiet "$SERVICE_FILE"; then
    echo "Devise Desktop Agent installed and running."
else
    echo "Warning: service installed but not running. Check: journalctl -u devise-agent" >&2
fi
