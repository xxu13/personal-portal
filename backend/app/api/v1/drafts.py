"""
Draft API endpoints for auto-saving.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.user import User
from app.models.draft import Draft
from app.schemas.draft import DraftCreate, DraftUpdate, DraftResponse
from app.api.v1.users import get_current_user

router = APIRouter(prefix="/drafts", tags=["Drafts"])


@router.get("", response_model=list[DraftResponse])
async def get_drafts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all drafts for current user.
    """
    result = await db.execute(
        select(Draft)
        .where(Draft.user_id == current_user.id)
        .order_by(Draft.auto_saved_at.desc())
    )
    drafts = result.scalars().all()
    return [DraftResponse.model_validate(d) for d in drafts]


@router.get("/{draft_id}", response_model=DraftResponse)
async def get_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific draft.
    """
    result = await db.execute(
        select(Draft).where(
            Draft.id == draft_id,
            Draft.user_id == current_user.id,
        )
    )
    draft = result.scalar_one_or_none()
    
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found",
        )
    
    return DraftResponse.model_validate(draft)


@router.post("", response_model=DraftResponse, status_code=status.HTTP_201_CREATED)
async def create_draft(
    draft_create: DraftCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new draft or update existing draft for the same post.
    """
    # Check if there's already a draft for this post
    if draft_create.post_id:
        result = await db.execute(
            select(Draft).where(
                Draft.user_id == current_user.id,
                Draft.post_id == draft_create.post_id,
            )
        )
        existing_draft = result.scalar_one_or_none()
        
        if existing_draft:
            # Update existing draft
            for field, value in draft_create.model_dump(exclude_unset=True).items():
                setattr(existing_draft, field, value)
            await db.commit()
            await db.refresh(existing_draft)
            return DraftResponse.model_validate(existing_draft)
    
    # Create new draft
    draft = Draft(
        user_id=current_user.id,
        **draft_create.model_dump()
    )
    db.add(draft)
    await db.commit()
    await db.refresh(draft)
    
    return DraftResponse.model_validate(draft)


@router.put("/{draft_id}", response_model=DraftResponse)
async def update_draft(
    draft_id: int,
    draft_update: DraftUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a draft.
    """
    result = await db.execute(
        select(Draft).where(
            Draft.id == draft_id,
            Draft.user_id == current_user.id,
        )
    )
    draft = result.scalar_one_or_none()
    
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found",
        )
    
    for field, value in draft_update.model_dump(exclude_unset=True).items():
        setattr(draft, field, value)
    
    await db.commit()
    await db.refresh(draft)
    
    return DraftResponse.model_validate(draft)


@router.delete("/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a draft.
    """
    result = await db.execute(
        select(Draft).where(
            Draft.id == draft_id,
            Draft.user_id == current_user.id,
        )
    )
    draft = result.scalar_one_or_none()
    
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found",
        )
    
    await db.delete(draft)
    await db.commit()

