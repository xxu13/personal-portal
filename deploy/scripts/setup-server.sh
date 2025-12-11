#!/bin/bash
# ==========================================
# Personal Portal - Server Setup Script
# Run this script once on a fresh Ubuntu server
# ==========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/personal-portal"
FRONTEND_DIR="/var/www/personal-portal"
SSL_DIR="/etc/ssl/private/shawn.xin"
DOMAIN="shawn.xin"

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  Personal Portal - Server Setup${NC}"
echo -e "${GREEN}===========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# ==========================================
# 1. System Update
# ==========================================
echo -e "\n${YELLOW}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

# ==========================================
# 2. Install Dependencies
# ==========================================
echo -e "\n${YELLOW}[2/10] Installing system dependencies...${NC}"
apt install -y \
    nginx \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    nodejs \
    npm \
    git \
    curl \
    wget \
    htop \
    ufw \
    libmagic1

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "\n${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo -e "\n${YELLOW}Installing Docker Compose...${NC}"
    apt install -y docker-compose-plugin
fi

# ==========================================
# 3. Configure Firewall
# ==========================================
echo -e "\n${YELLOW}[3/10] Configuring firewall...${NC}"
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
echo -e "${GREEN}Firewall configured: SSH, HTTP, HTTPS allowed${NC}"

# ==========================================
# 4. Create Directories
# ==========================================
echo -e "\n${YELLOW}[4/10] Creating directories...${NC}"

# Frontend directory
mkdir -p ${FRONTEND_DIR}
chown -R www-data:www-data ${FRONTEND_DIR}

# SSL directory
mkdir -p ${SSL_DIR}
chmod 700 ${SSL_DIR}

# Backend uploads directory
mkdir -p ${PROJECT_DIR}/backend/uploads/{images,avatars}
chown -R www-data:www-data ${PROJECT_DIR}/backend/uploads

echo -e "${GREEN}Directories created:${NC}"
echo "  - ${FRONTEND_DIR}"
echo "  - ${SSL_DIR}"
echo "  - ${PROJECT_DIR}/backend/uploads/"

# ==========================================
# 5. Setup Python Virtual Environment
# ==========================================
echo -e "\n${YELLOW}[5/10] Setting up Python virtual environment...${NC}"
cd ${PROJECT_DIR}/backend

if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

chown -R www-data:www-data ${PROJECT_DIR}/backend/venv
echo -e "${GREEN}Python venv created at ${PROJECT_DIR}/backend/venv${NC}"

# ==========================================
# 6. Install SSL Certificate
# ==========================================
echo -e "\n${YELLOW}[6/10] Setting up SSL certificate directory...${NC}"

if [ ! -f "${SSL_DIR}/origin.pem" ]; then
    echo -e "${YELLOW}SSL certificates not found.${NC}"
    echo -e "Please copy your Cloudflare Origin certificates to:"
    echo -e "  ${SSL_DIR}/origin.pem"
    echo -e "  ${SSL_DIR}/origin-key.pem"
    echo ""
    echo -e "Then set permissions:"
    echo -e "  chmod 644 ${SSL_DIR}/origin.pem"
    echo -e "  chmod 600 ${SSL_DIR}/origin-key.pem"
else
    chmod 644 ${SSL_DIR}/origin.pem
    chmod 600 ${SSL_DIR}/origin-key.pem
    echo -e "${GREEN}SSL certificates found and permissions set${NC}"
fi

# ==========================================
# 7. Configure Nginx
# ==========================================
echo -e "\n${YELLOW}[7/10] Configuring Nginx...${NC}"

# Copy site configuration
cp ${PROJECT_DIR}/deploy/nginx/personal-portal.conf /etc/nginx/sites-available/personal-portal

# Enable site
ln -sf /etc/nginx/sites-available/personal-portal /etc/nginx/sites-enabled/personal-portal

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

echo -e "${GREEN}Nginx configured${NC}"

# ==========================================
# 8. Setup Systemd Service
# ==========================================
echo -e "\n${YELLOW}[8/10] Setting up systemd service...${NC}"

# Copy service file
cp ${PROJECT_DIR}/deploy/systemd/personal-portal-backend.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable service (will start after .env is configured)
systemctl enable personal-portal-backend

echo -e "${GREEN}Systemd service installed${NC}"

# ==========================================
# 9. Setup Environment File
# ==========================================
echo -e "\n${YELLOW}[9/10] Setting up environment file...${NC}"

if [ ! -f "${PROJECT_DIR}/.env" ]; then
    cp ${PROJECT_DIR}/prod.env.example ${PROJECT_DIR}/.env
    echo -e "${YELLOW}Created .env file from template${NC}"
    echo -e "${RED}IMPORTANT: Edit ${PROJECT_DIR}/.env with your actual values!${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

# ==========================================
# 10. Start Docker Services
# ==========================================
echo -e "\n${YELLOW}[10/10] Starting Docker services (MySQL + Redis)...${NC}"

cd ${PROJECT_DIR}
docker compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}Docker services started${NC}"

# ==========================================
# Summary
# ==========================================
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Copy SSL certificates to ${SSL_DIR}/"
echo -e "  2. Edit ${PROJECT_DIR}/.env with your values"
echo -e "  3. Run database migrations:"
echo -e "     cd ${PROJECT_DIR}/backend && source venv/bin/activate"
echo -e "     alembic upgrade head"
echo -e "  4. Build and deploy frontend:"
echo -e "     cd ${PROJECT_DIR}/frontend && npm install && npm run build"
echo -e "     cp -r dist/* ${FRONTEND_DIR}/"
echo -e "  5. Start services:"
echo -e "     sudo systemctl start nginx"
echo -e "     sudo systemctl start personal-portal-backend"
echo ""
echo -e "Or simply run: ${GREEN}${PROJECT_DIR}/deploy/scripts/deploy.sh${NC}"
echo ""

