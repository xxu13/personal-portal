"""
Category API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse, CategoryListResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryListResponse])
async def get_categories(
    db: AsyncSession = Depends(get_db),
):
    """
    Get all categories.
    """
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.posts))
        .order_by(Category.sort_order.asc(), Category.name.asc())
    )
    categories = result.scalars().all()
    
    # Convert to response with post_count
    return [
        CategoryListResponse(
            id=cat.id,
            name=cat.name,
            name_en=cat.name_en,
            slug=cat.slug,
            icon=cat.icon,
            post_count=len([p for p in cat.posts if p.status == "published"]),
        )
        for cat in categories
    ]


@router.get("/{slug}", response_model=CategoryResponse)
async def get_category_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get category by slug.
    """
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.posts))
        .where(Category.slug == slug)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        name_en=category.name_en,
        slug=category.slug,
        icon=category.icon,
        description=category.description,
        sort_order=category.sort_order,
        post_count=len([p for p in category.posts if p.status == "published"]),
        created_at=category.created_at,
    )

