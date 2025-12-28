#!/bin/bash

# Script to install Nginx for Debian/Ubuntu systems

# 1. Check for Root/Sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or usage: sudo ./setup_nginx.sh"
  exit 1
fi

echo "--- Updating Package Cache ---"
apt-get update

echo "--- Installing Nginx ---"
apt-get install -y nginx

echo "--- Starting Nginx Service ---"
# Check if systemd is available (common in VMs) or use service command (common in containers)
if pidof systemd >/dev/null; then
    systemctl start nginx
    systemctl enable nginx
else
    service nginx start
fi

echo "--- Nginx Status ---"
service nginx status

echo "--- Done! Access Nginx at http://localhost:80 ---"
