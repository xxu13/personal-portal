# Personal Portal - 部署指南

## 目录

1. [开发环境部署](#开发环境部署)
2. [生产环境部署](#生产环境部署)
3. [常用命令](#常用命令)
4. [故障排除](#故障排除)

---

## 开发环境部署

### 前置要求

- Docker & Docker Compose
- Node.js 18+
- Python 3.10+

### 步骤

1. **启动数据库服务**

```bash
docker-compose up -d
```

这将启动：
- MySQL (端口 3306)
- Redis (端口 6379)
- phpMyAdmin (端口 8080)

2. **配置后端**

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp env.example .env
# 编辑 .env 文件

# 运行数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

3. **配置前端**

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

4. **访问应用**

- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs
- phpMyAdmin: http://localhost:8080

---

## 生产环境部署

### 前置要求

- Docker & Docker Compose
- 域名（可选，用于 HTTPS）
- 至少 2GB RAM

### 步骤

1. **配置环境变量**

```bash
# 复制模板
cp prod.env.example .env

# 编辑配置
nano .env
```

必须配置：
- `DOMAIN`: 你的域名
- `DB_ROOT_PASSWORD`: MySQL root 密码
- `DB_PASSWORD`: 应用数据库密码
- `SECRET_KEY`: JWT 密钥（至少32字符）
- `ADMIN_PASSWORD`: 管理员密码

2. **构建和启动服务**

```bash
# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

3. **初始化数据库**

```bash
# 进入后端容器
docker exec -it personal-portal-backend bash

# 运行初始化脚本
python /app/scripts/init_db.py
```

4. **配置 HTTPS（推荐）**

使用 Certbot 或其他工具配置 SSL 证书。

---

## 常用命令

### Docker 操作

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f [service]

# 重启服务
docker-compose -f docker-compose.prod.yml restart [service]

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 停止并删除数据
docker-compose -f docker-compose.prod.yml down -v
```

### 数据库操作

```bash
# 进入 MySQL
docker exec -it personal-portal-mysql mysql -u root -p

# 备份数据库
docker exec personal-portal-mysql mysqldump -u root -p personal_portal > backup.sql

# 恢复数据库
docker exec -i personal-portal-mysql mysql -u root -p personal_portal < backup.sql
```

### 应用更新

```bash
# 拉取最新代码
git pull

# 重新构建
docker-compose -f docker-compose.prod.yml build

# 滚动更新
docker-compose -f docker-compose.prod.yml up -d --no-deps backend frontend

# 运行迁移（如有）
docker exec personal-portal-backend alembic upgrade head
```

---

## 故障排除

### 容器无法启动

```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs [service]

# 检查容器状态
docker inspect personal-portal-[service]
```

### 数据库连接失败

1. 确认 MySQL 容器正在运行
2. 检查 DATABASE_URL 格式
3. 确认用户名密码正确

### 前端无法访问后端

1. 检查 Nginx 配置
2. 确认后端健康检查通过
3. 查看 Nginx 错误日志

### WebSocket 连接失败

1. 确认 Nginx WebSocket 代理配置
2. 检查防火墙是否允许 WebSocket
3. 查看后端 WebSocket 日志

---

## 架构说明

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │ :80/:443
                    │  (Frontend) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
      ┌───────▼───────┐    │    ┌───────▼───────┐
      │ Static Files  │    │    │  API Proxy    │
      │   (React)     │    │    │   /api/*      │
      └───────────────┘    │    └───────┬───────┘
                           │            │
                    ┌──────▼──────┐     │
                    │  WebSocket  │     │
                    │   /ws/*     │     │
                    └──────┬──────┘     │
                           │            │
                    ┌──────▼────────────▼──────┐
                    │         Backend          │ :8000
                    │        (FastAPI)         │
                    └──────┬──────────────┬────┘
                           │              │
                    ┌──────▼──────┐ ┌─────▼─────┐
                    │    MySQL    │ │   Redis   │
                    │   :3306     │ │   :6379   │
                    └─────────────┘ └───────────┘
```

