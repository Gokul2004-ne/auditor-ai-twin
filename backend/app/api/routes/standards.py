from fastapi import APIRouter, HTTPException
from app.services.neo4j_service import neo4j_service
from app.api.deps import CurrentUser

router = APIRouter(prefix="/standards", tags=["standards"])


@router.get("")
async def list_standards(user: CurrentUser):
    return await neo4j_service.get_all_standards()


@router.get("/{standard_id}")
async def get_standard(standard_id: str, user: CurrentUser):
    standard = await neo4j_service.get_standard(standard_id)
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found")
    return standard


@router.get("/{standard_id}/clauses")
async def list_clauses(standard_id: str, user: CurrentUser):
    return await neo4j_service.get_clauses_for_standard(standard_id)
