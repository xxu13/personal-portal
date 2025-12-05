-- ==========================================
-- Personal Portal - MySQL Initialization
-- This script runs on first container start
-- ==========================================

-- Set character encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database if not exists (should already exist from MYSQL_DATABASE env)
CREATE DATABASE IF NOT EXISTS personal_portal
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE personal_portal;

-- Grant privileges to application user
GRANT ALL PRIVILEGES ON personal_portal.* TO 'portal_user'@'%';
FLUSH PRIVILEGES;

-- Log initialization
SELECT 'Database initialized successfully' AS status;

