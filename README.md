# Personal Portal

个人展示网站 - 集成博客、作品展示、论坛功能的现代化个人门户。

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI组件库**: Ant Design 5
- **状态管理**: Zustand
- **富文本编辑器**: TipTap 2
- **国际化**: react-i18next
- **动画**: Framer Motion

### 后端
- **框架**: FastAPI
- **ORM**: SQLAlchemy 2 (异步)
- **数据库**: MySQL 8.0
- **缓存**: Redis 7
- **认证**: JWT

### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx

## 功能特性

- 🔐 用户认证系统（注册、登录、JWT）
- 📝 内容管理（帖子、分类、标签、草稿）
- ✏️ 富文本编辑器（支持图片、代码高亮）
- 💬 无限嵌套评论系统
- ❤️ 互动功能（点赞、收藏）
- 💌 私信系统
- 🔔 实时通知（WebSocket）
- 🌍 国际化（中英双语）
- 📱 响应式设计
- 🎨 现代科技风深色主题

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose

### 1. 克隆项目

```bash
git clone <repository-url>
cd personal-portal
```

### 2. 启动数据库服务

```bash
docker-compose up -d
```

### 3. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 复制环境配置
cp env.example .env
# 编辑 .env 文件配置数据库等

# 运行数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

### 4. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 5. 访问应用

- 前端: http://localhost:3000
- 后端API文档: http://localhost:8000/docs
- phpMyAdmin: http://localhost:8080

## 项目结构

```
personal-portal/
├── frontend/                # React 前端
│   ├── public/              # 静态资源
│   │   └── locales/         # 国际化文件
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── pages/           # 页面
│   │   ├── stores/          # 状态管理
│   │   ├── services/        # API服务
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── styles/          # 样式文件
│   │   ├── i18n/            # 国际化配置
│   │   └── router/          # 路由配置
│   └── package.json
│
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/v1/          # API路由
│   │   ├── core/            # 核心配置
│   │   ├── models/          # 数据模型
│   │   ├── schemas/         # Pydantic模式
│   │   ├── services/        # 业务逻辑
│   │   ├── websocket/       # WebSocket
│   │   └── db/              # 数据库
│   ├── migrations/          # 数据库迁移
│   ├── uploads/             # 上传文件
│   └── requirements.txt
│
├── docker/                  # Docker配置
├── docker-compose.yml       # 开发环境
└── README.md
```

## 开发指南

### 代码规范

- 前端使用 ESLint + TypeScript 严格模式
- 后端遵循 PEP 8 规范
- 提交信息遵循 Conventional Commits

### 分支管理

- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支

## 许可证

MIT License

