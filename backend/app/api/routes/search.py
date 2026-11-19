from typing import Optional
from fastapi import APIRouter, Query
from app.services.document_service import document_service
from app.services.neo4j_service import neo4j_service
from app.api.deps import CurrentUser

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def semantic_search(
    q: str = Query(..., min_length=1),
    audit_id: Optional[str] = Query(default=None),
    document_id: Optional[str] = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
    user: CurrentUser = None,
):
    organization_id = (user or {}).get("organization_id", (user or {}).get("id", ""))
    results = await document_service.search_document_context(
        query=q,
        organization_id=organization_id,
        audit_id=audit_id,
        document_id=document_id,
        limit=limit,
    )
    return {"query": q, "results": results, "count": len(results)}


@router.get("/clauses")
async def search_clauses(
    q: str = Query(..., min_length=1),
    standard_id: Optional[str] = Query(default=None),
    user: CurrentUser = None,
):
    return await neo4j_service.search_clauses(q, standard_id)
