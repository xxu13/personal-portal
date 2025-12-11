# Personal Portal - 部署指南

本文档描述如何将 Personal Portal 部署到生产服务器。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                   服务器 (Ubuntu 22.04+)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Nginx (系统级, systemd)                  │   │
│   │         - SSL (Cloudflare Origin 证书)              │   │
│   │         - 静态文件 /var/www/personal-portal         │   │
│   │         - 反向代理 → localhost:8000                 │   │
│   └─────────────────────────────────────────────────────┘   │
│                              │                              │
│              ┌───────────────┴───────────────┐              │
│              ▼                               ▼              │
│   ┌──────────────────────┐       ┌──────────────────────┐   │
│   │  Backend (systemd)   │       │      Docker          │   │
│   │  Python venv         │       │  ┌────────────────┐  │   │
│   │  uvicorn --workers 4 │       │  │ MySQL :3306    │  │   │
│   │  localhost:8000      │◄──────┤  │ Redis :6379    │  │   │
│   └──────────────────────┘       │  └────────────────┘  │   │
│                                  └──────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 前提条件

- Ubuntu 22.04 LTS 或更高版本
- 具有 sudo 权限的用户
- 域名已配置 DNS 指向服务器 IP
- Cloudflare 账户（用于 SSL 和 CDN）

## 第一部分：Cloudflare 配置

### 1.1 添加站点到 Cloudflare

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击 "Add a Site"，输入域名 `shawn.xin`
3. 选择计划（Free 即可）
4. Cloudflare 会扫描现有 DNS 记录

### 1.2 配置 DNS 记录

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|----------|
| A | @ | 121.41.57.37 | 已代理 (橙云) |
| A | www | 121.41.57.37 | 已代理 (橙云) |

### 1.3 修改域名 NS 记录

在阿里云域名管理中，将 NS 记录修改为 Cloudflare 提供的值：
- `xxx.ns.cloudflare.com`
- `yyy.ns.cloudflare.com`

### 1.4 配置 SSL/TLS

1. 进入 SSL/TLS → Overview
2. 加密模式选择 **Full (Strict)**
3. 进入 SSL/TLS → Origin Server
4. 点击 "Create Certificate"
   - Private key type: RSA (2048)
   - Hostnames: `shawn.xin`, `*.shawn.xin`
   - Certificate Validity: 15 years
5. 下载证书和私钥：
   - `origin.pem` - 证书
   - `origin-key.pem` - 私钥

## 第二部分：服务器配置

### 2.1 获取代码

```bash
# 克隆仓库
cd /home
git clone https://github.com/your-username/personal-portal.git
cd personal-portal
```

### 2.2 运行初始化脚本

```bash
sudo ./deploy/scripts/setup-server.sh
```

此脚本会自动完成：
- 安装系统依赖（nginx, python3.11, nodejs, docker）
- 配置防火墙
- 创建目录结构
- 设置 Python 虚拟环境
- 配置 Nginx 站点
- 安装 systemd 服务

### 2.3 安装 SSL 证书

将从 Cloudflare 下载的证书复制到服务器：

```bash
# 创建证书目录
sudo mkdir -p /etc/ssl/private/shawn.xin

# 复制证书文件（使用 scp 或手动创建）
sudo nano /etc/ssl/private/shawn.xin/origin.pem
# 粘贴证书内容

sudo nano /etc/ssl/private/shawn.xin/origin-key.pem
# 粘贴私钥内容

# 设置权限
sudo chmod 644 /etc/ssl/private/shawn.xin/origin.pem
sudo chmod 600 /etc/ssl/private/shawn.xin/origin-key.pem
```

### 2.4 配置环境变量

```bash
# 复制环境变量模板
cp prod.env.example .env

# 编辑环境变量
nano .env
```

**必须修改的配置项：**

```bash
# 数据库密码（设置强密码）
DB_ROOT_PASSWORD=your-strong-root-password
DB_PASSWORD=your-strong-db-password

# 更新 DATABASE_URL 中的密码
DATABASE_URL=mysql+asyncmy://portal_user:your-strong-db-password@127.0.0.1:3306/personal_portal

# JWT 密钥（生成随机字符串）
SECRET_KEY=$(openssl rand -hex 32)

# 管理员密码
ADMIN_PASSWORD=your-admin-password
```

### 2.5 启动数据库服务

```bash
# 启动 MySQL 和 Redis
docker compose -f docker-compose.prod.yml up -d

# 检查服务状态
docker compose -f docker-compose.prod.yml ps

# 等待 MySQL 完全启动（约 30 秒）
sleep 30
```

### 2.6 初始化数据库

```bash
cd backend
source venv/bin/activate

# 运行数据库迁移
alembic upgrade head

# 创建管理员账户（可选）
python -c "from scripts.init_db import init_db; init_db()"

deactivate
```

### 2.7 构建并部署前端

```bash
cd /home/personal-portal/frontend

# 安装依赖
npm ci

# 构建生产版本
npm run build

# 部署到 Nginx 目录
sudo rm -rf /var/www/personal-portal/*
sudo cp -r dist/* /var/www/personal-portal/
sudo chown -R www-data:www-data /var/www/personal-portal
```

### 2.8 启动服务

```bash
# 启动后端服务
sudo systemctl start personal-portal-backend

# 启动 Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable personal-portal-backend
sudo systemctl enable nginx
```

### 2.9 验证部署

```bash
# 检查服务状态
sudo systemctl status personal-portal-backend
sudo systemctl status nginx
docker compose -f docker-compose.prod.yml ps

# 测试 API
curl -s http://localhost:8000/api/v1/health

# 测试网站（通过 Cloudflare）
curl -s https://shawn.xin/health
```

## 日常运维

### 更新部署

使用部署脚本一键更新：

```bash
cd /home/personal-portal
./deploy/scripts/deploy.sh
```

可选参数：
- `--skip-frontend` - 跳过前端构建
- `--skip-backend` - 跳过后端更新
- `--skip-migrate` - 跳过数据库迁移

### 查看日志

```bash
# 后端日志
sudo journalctl -u personal-portal-backend -f

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# MySQL 日志
docker logs personal-portal-mysql -f

# Redis 日志
docker logs personal-portal-redis -f
```

### 重启服务

```bash
# 重启后端
sudo systemctl restart personal-portal-backend

# 重载 Nginx（配置变更后）
sudo systemctl reload nginx

# 重启数据库
docker compose -f docker-compose.prod.yml restart
```

### 备份数据

```bash
# 备份 MySQL 数据库
docker exec personal-portal-mysql mysqldump -u root -p personal_portal > backup_$(date +%Y%m%d).sql

# 备份上传文件
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# 备份 Redis 数据（如果需要）
docker exec personal-portal-redis redis-cli BGSAVE
```

## 故障排除

### 后端服务无法启动

```bash
# 查看详细错误
sudo journalctl -u personal-portal-backend -n 50 --no-pager

# 常见问题：
# 1. .env 文件不存在或配置错误
# 2. MySQL 未启动
# 3. Python 依赖缺失
```

### Nginx 配置错误

```bash
# 测试配置语法
sudo nginx -t

# 常见问题：
# 1. SSL 证书路径错误
# 2. 证书文件权限问题
```

### 数据库连接失败

```bash
# 检查 MySQL 是否运行
docker ps | grep mysql

# 测试连接
mysql -h 127.0.0.1 -u portal_user -p personal_portal

# 常见问题：
# 1. 密码不匹配
# 2. MySQL 容器未完全启动
```

### 502 Bad Gateway

```bash
# 检查后端是否运行
sudo systemctl status personal-portal-backend

# 检查后端端口
ss -tlnp | grep 8000

# 常见问题：
# 1. 后端服务未启动
# 2. 端口被占用
```

## 安全建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置 fail2ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **定期备份**
   - 设置 cron 任务自动备份数据库
   - 使用云存储保存备份

4. **监控服务**
   - 配置 UptimeRobot 或类似服务监控网站可用性
   - 设置告警通知

## 联系支持

如有问题，请提交 Issue 或联系管理员。
