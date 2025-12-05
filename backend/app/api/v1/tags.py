"""
Tag API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db
from app.models.tag import Tag
from app.schemas.tag import TagResponse, TagListResponse

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get("", response_model=list[TagListResponse])
async def get_tags(
    db: AsyncSession = Depends(get_db),
):
    """
    Get all tags.
    """
    result = await db.execute(
        select(Tag)
        .options(selectinload(Tag.posts))
        .order_by(Tag.name.asc())
    )
    tags = result.scalars().all()
    
    return [
        TagListResponse(
            id=tag.id,
            name=tag.name,
            name_en=tag.name_en,
            slug=tag.slug,
            post_count=len([p for p in tag.posts if p.status == "published"]),
        )
        for tag in tags
    ]


@router.get("/popular", response_model=list[TagListResponse])
async def get_popular_tags(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get popular tags (by post count).
    """
    result = await db.execute(
        select(Tag)
        .options(selectinload(Tag.posts))
        .order_by(Tag.name.asc())
    )
    tags = result.scalars().all()
    
    # Calculate post counts and sort
    tag_list = [
        TagListResponse(
            id=tag.id,
            name=tag.name,
            name_en=tag.name_en,
            slug=tag.slug,
            post_count=len([p for p in tag.posts if p.status == "published"]),
        )
        for tag in tags
    ]
    
    # Sort by post_count descending
    tag_list.sort(key=lambda x: x.post_count, reverse=True)
    
    return tag_list[:limit]


@router.get("/{slug}", response_model=TagResponse)
async def get_tag_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get tag by slug.
    """
    result = await db.execute(
        select(Tag)
        .options(selectinload(Tag.posts))
        .where(Tag.slug == slug)
    )
    tag = result.scalar_one_or_none()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )
    
    return TagResponse(
        id=tag.id,
        name=tag.name,
        name_en=tag.name_en,
        slug=tag.slug,
        post_count=len([p for p in tag.posts if p.status == "published"]),
        created_at=tag.created_at,
    )

