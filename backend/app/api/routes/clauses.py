from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.neo4j_service import neo4j_service
from app.api.deps import CurrentUser

router = APIRouter(prefix="/clauses", tags=["clauses"])


@router.get("/{clause_id}")
async def get_clause(clause_id: str, user: CurrentUser):
    clause = await neo4j_service.get_clause(clause_id)
    if not clause:
        raise HTTPException(status_code=404, detail="Clause not found")
    return clause


@router.get("/{clause_id}/graph")
async def get_clause_graph(
    clause_id: str,
    depth: int = Query(default=2, ge=1, le=4),
    user: CurrentUser = None,
):
    return await neo4j_service.get_clause_graph(clause_id, depth)


@router.get("/search")
async def search_clauses(
    q: str = Query(..., min_length=2),
    standard_id: Optional[str] = Query(default=None),
    user: CurrentUser = None,
):
    return await neo4j_service.search_clauses(q, standard_id)
