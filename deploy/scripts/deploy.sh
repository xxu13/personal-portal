#!/bin/bash
# ==========================================
# Personal Portal - Deployment Script
# Run this script to deploy updates
# ==========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/personal-portal"
FRONTEND_DIR="/var/www/personal-portal"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_SRC="${PROJECT_DIR}/frontend"

# Parse arguments
SKIP_FRONTEND=false
SKIP_BACKEND=false
SKIP_MIGRATE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-frontend) SKIP_FRONTEND=true; shift ;;
        --skip-backend) SKIP_BACKEND=true; shift ;;
        --skip-migrate) SKIP_MIGRATE=true; shift ;;
        --help)
            echo "Usage: deploy.sh [OPTIONS]"
            echo "Options:"
            echo "  --skip-frontend  Skip frontend build and deploy"
            echo "  --skip-backend   Skip backend deploy"
            echo "  --skip-migrate   Skip database migration"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  Personal Portal - Deployment${NC}"
echo -e "${GREEN}===========================================${NC}"
echo -e "  Skip Frontend: ${SKIP_FRONTEND}"
echo -e "  Skip Backend:  ${SKIP_BACKEND}"
echo -e "  Skip Migrate:  ${SKIP_MIGRATE}"
echo -e "${GREEN}===========================================${NC}"

# ==========================================
# 1. Pull Latest Code
# ==========================================
echo -e "\n${YELLOW}[1/6] Pulling latest code...${NC}"
cd ${PROJECT_DIR}
git pull origin main
echo -e "${GREEN}Code updated${NC}"

# ==========================================
# 2. Frontend Build & Deploy
# ==========================================
if [ "$SKIP_FRONTEND" = false ]; then
    echo -e "\n${YELLOW}[2/6] Building frontend...${NC}"
    cd ${FRONTEND_SRC}
    
    # Install dependencies if package-lock.json changed
    npm ci
    
    # Build production bundle
    npm run build
    
    # Deploy to web root
    echo -e "${BLUE}Deploying frontend to ${FRONTEND_DIR}...${NC}"
    rm -rf ${FRONTEND_DIR}/*
    cp -r dist/* ${FRONTEND_DIR}/
    chown -R www-data:www-data ${FRONTEND_DIR}
    
    echo -e "${GREEN}Frontend deployed${NC}"
else
    echo -e "\n${YELLOW}[2/6] Skipping frontend build${NC}"
fi

# ==========================================
# 3. Backend Dependencies
# ==========================================
if [ "$SKIP_BACKEND" = false ]; then
    echo -e "\n${YELLOW}[3/6] Updating backend dependencies...${NC}"
    cd ${BACKEND_DIR}
    
    source venv/bin/activate
    pip install -r requirements.txt --quiet
    deactivate
    
    echo -e "${GREEN}Backend dependencies updated${NC}"
else
    echo -e "\n${YELLOW}[3/6] Skipping backend dependencies${NC}"
fi

# ==========================================
# 4. Database Migration
# ==========================================
if [ "$SKIP_MIGRATE" = false ]; then
    echo -e "\n${YELLOW}[4/6] Running database migrations...${NC}"
    cd ${BACKEND_DIR}
    
    source venv/bin/activate
    
    # Wait for MySQL to be ready
    echo "Waiting for MySQL..."
    for i in {1..30}; do
        if mysqladmin ping -h 127.0.0.1 -u portal_user -p${DB_PASSWORD} --silent 2>/dev/null; then
            break
        fi
        sleep 1
    done
    
    # Run migrations
    alembic upgrade head
    deactivate
    
    echo -e "${GREEN}Migrations complete${NC}"
else
    echo -e "\n${YELLOW}[4/6] Skipping database migration${NC}"
fi

# ==========================================
# 5. Restart Backend Service
# ==========================================
if [ "$SKIP_BACKEND" = false ]; then
    echo -e "\n${YELLOW}[5/6] Restarting backend service...${NC}"
    
    sudo systemctl restart personal-portal-backend
    
    # Wait for service to start
    sleep 3
    
    # Check service status
    if systemctl is-active --quiet personal-portal-backend; then
        echo -e "${GREEN}Backend service running${NC}"
    else
        echo -e "${RED}Backend service failed to start!${NC}"
        sudo journalctl -u personal-portal-backend -n 20 --no-pager
        exit 1
    fi
else
    echo -e "\n${YELLOW}[5/6] Skipping backend restart${NC}"
fi

# ==========================================
# 6. Reload Nginx
# ==========================================
echo -e "\n${YELLOW}[6/6] Reloading Nginx...${NC}"

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo -e "${GREEN}Nginx reloaded${NC}"

# ==========================================
# Summary
# ==========================================
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "Services status:"
echo -e "  Nginx:   $(systemctl is-active nginx)"
echo -e "  Backend: $(systemctl is-active personal-portal-backend)"
echo -e "  MySQL:   $(docker ps --filter name=personal-portal-mysql --format '{{.Status}}' 2>/dev/null || echo 'not running')"
echo -e "  Redis:   $(docker ps --filter name=personal-portal-redis --format '{{.Status}}' 2>/dev/null || echo 'not running')"
echo ""
echo -e "Site: ${GREEN}https://shawn.xin${NC}"
echo ""

