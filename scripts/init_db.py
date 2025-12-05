#!/usr/bin/env python3
"""
Personal Portal - Database Initialization Script

This script initializes the database with:
1. Run all migrations
2. Create default categories
3. Create admin user

Usage:
    python scripts/init_db.py

Environment variables required:
    - DATABASE_URL
    - ADMIN_USERNAME
    - ADMIN_EMAIL  
    - ADMIN_PASSWORD
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

async def run_migrations():
    """Run alembic migrations"""
    import subprocess
    print("🔄 Running database migrations...")
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=backend_path,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"❌ Migration failed: {result.stderr}")
        return False
    print("✅ Migrations completed")
    return True


async def create_default_categories(db):
    """Create default content categories"""
    from app.models.category import Category
    from sqlalchemy import select
    
    print("🔄 Creating default categories...")
    
    categories = [
        {"name": "作品", "name_en": "Works", "slug": "works", "icon": "🎨", "sort_order": 1},
        {"name": "技术", "name_en": "Tech", "slug": "tech", "icon": "💻", "sort_order": 2},
        {"name": "生活", "name_en": "Life", "slug": "life", "icon": "🌱", "sort_order": 3},
        {"name": "项目", "name_en": "Projects", "slug": "projects", "icon": "🚀", "sort_order": 4},
    ]
    
    for cat_data in categories:
        # Check if category exists
        result = await db.execute(
            select(Category).where(Category.slug == cat_data["slug"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            category = Category(**cat_data)
            db.add(category)
            print(f"  ✅ Created category: {cat_data['name']}")
        else:
            print(f"  ⏭️ Category exists: {cat_data['name']}")
    
    await db.commit()
    print("✅ Categories initialized")


async def create_admin_user(db):
    """Create admin user from environment variables"""
    from app.models.user import User
    from app.core.security import get_password_hash
    from sqlalchemy import select
    
    print("🔄 Creating admin user...")
    
    username = os.getenv("ADMIN_USERNAME", "admin")
    email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    password = os.getenv("ADMIN_PASSWORD", "admin123456")
    
    # Check if admin exists
    result = await db.execute(
        select(User).where(User.username == username)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        print(f"  ⏭️ Admin user already exists: {username}")
        return
    
    admin = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        nickname="Administrator",
        role="admin",
        is_active=True,
    )
    db.add(admin)
    await db.commit()
    
    print(f"  ✅ Created admin user: {username}")
    print(f"     Email: {email}")
    print(f"     Password: {password}")
    print("     ⚠️ Please change the password after first login!")


async def main():
    """Main initialization function"""
    print("=" * 50)
    print("Personal Portal - Database Initialization")
    print("=" * 50)
    print()
    
    # Check environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable is required")
        sys.exit(1)
    
    # Run migrations
    if not await run_migrations():
        sys.exit(1)
    
    # Initialize database session
    print()
    print("🔄 Connecting to database...")
    
    try:
        from app.db.session import async_session_maker
        
        async with async_session_maker() as db:
            await create_default_categories(db)
            print()
            await create_admin_user(db)
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)
    
    print()
    print("=" * 50)
    print("✅ Database initialization completed!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())

