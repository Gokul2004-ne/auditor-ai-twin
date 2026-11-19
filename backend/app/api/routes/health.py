from fastapi import APIRouter
from app.services.neo4j_service import neo4j_service
from app.services.qdrant_service import qdrant_service

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    status = {"status": "ok", "services": {}}

    # Check Neo4j
    try:
        await neo4j_service.run_query("RETURN 1 AS n")
        status["services"]["neo4j"] = "ok"
    except Exception as e:
        status["services"]["neo4j"] = f"error: {str(e)[:100]}"
        status["status"] = "degraded"

    # Check Qdrant
    try:
        info = qdrant_service.get_collection_info()
        status["services"]["qdrant"] = f"ok (vectors: {info.get('vectors_count', 0)})"
    except Exception as e:
        status["services"]["qdrant"] = f"error: {str(e)[:100]}"
        status["status"] = "degraded"

    return status
