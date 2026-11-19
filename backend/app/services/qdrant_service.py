from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue,
)
from app.core.config import settings
import logging
import uuid

logger = logging.getLogger(__name__)


class QdrantService:
    def __init__(self):
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
        self.collection = settings.qdrant_collection

    async def connect(self):
        self.ensure_collection(vector_size=384)

    async def close(self):
        pass

    def ensure_collection(self, vector_size: int = 384):
        """Create collection if it doesn't exist."""
        try:
            collections = self.client.get_collections().collections
            names = [c.name for c in collections]
            if self.collection not in names:
                self.client.create_collection(
                    collection_name=self.collection,
                    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
                )
                logger.info(f"Created Qdrant collection: {self.collection}")
            
            # Ensure payload indexes for filtering
            for field in ["organization_id", "audit_id", "document_id"]:
                try:
                    self.client.create_payload_index(
                        collection_name=self.collection,
                        field_name=field,
                        field_schema="keyword",
                    )
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Error ensuring Qdrant collection: {e}")

    def upsert_chunks(self, chunks: list[dict], vectors: list[list[float]]):
        """Store document chunks with vectors. Idempotent via point_id."""
        vec_size = len(vectors[0]) if vectors and len(vectors) > 0 else 384
        self.ensure_collection(vector_size=vec_size)
        points = []
        for chunk, vector in zip(chunks, vectors):
            point_id = chunk.get('point_id') or str(uuid.uuid4())
            points.append(PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "organization_id": chunk.get('organization_id', ''),
                    "audit_id": chunk.get('audit_id', ''),
                    "document_id": chunk.get('document_id', ''),
                    "file_name": chunk.get('file_name', chunk.get('filename', '')),
                    "page_number": chunk.get('page_number', chunk.get('page', 0)),
                    "section": chunk.get('section', ''),
                    "chunk_index": chunk.get('chunk_index', 0),
                    "text": chunk.get('text', ''),
                }
            ))
        self.client.upsert(collection_name=self.collection, points=points)
        return len(points)

    def search(
        self,
        query_vector: list[float],
        organization_id: str,
        audit_id: str = None,
        document_id: str = None,
        top_k: int = 10,
        limit: int = None,
    ) -> list[dict]:
        """Search with mandatory tenant filtering."""
        try:
            self.ensure_collection(vector_size=len(query_vector) if query_vector else 384)
        except Exception:
            pass
        limit_to_use = limit or top_k
        must_conditions = [
            FieldCondition(key="organization_id", match=MatchValue(value=organization_id)),
        ]
        if audit_id:
            must_conditions.append(
                FieldCondition(key="audit_id", match=MatchValue(value=audit_id))
            )
        if document_id:
            must_conditions.append(
                FieldCondition(key="document_id", match=MatchValue(value=document_id))
            )

        res = self.client.query_points(
            collection_name=self.collection,
            query=query_vector,
            query_filter=Filter(must=must_conditions),
            limit=limit_to_use,
            with_payload=True,
        )
        results = res.points if hasattr(res, 'points') else res

        return [
            {
                "point_id": str(r.id),
                "score": r.score,
                "text": r.payload.get("text", ""),
                "page_number": r.payload.get("page_number", 0),
                "section": r.payload.get("section", ""),
                "document_id": r.payload.get("document_id", ""),
                "file_name": r.payload.get("file_name", ""),
            }
            for r in results
        ]

    def delete_by_document(self, document_id: str):
        self.client.delete(
            collection_name=self.collection,
            points_selector=Filter(must=[
                FieldCondition(key="document_id", match=MatchValue(value=document_id))
            ])
        )

    def delete_audit_vectors(self, audit_id: str, organization_id: str):
        """Remove all vectors for an audit."""
        self.client.delete(
            collection_name=self.collection,
            points_selector=Filter(must=[
                FieldCondition(key="organization_id", match=MatchValue(value=organization_id)),
                FieldCondition(key="audit_id", match=MatchValue(value=audit_id)),
            ])
        )

    def get_collection_info(self) -> dict:
        try:
            info = self.client.get_collection(self.collection)
            return {"status": "ok", "vectors_count": getattr(info, 'vectors_count', 0) or 0}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def health_check(self) -> bool:
        try:
            self.client.get_collections()
            return True
        except Exception:
            return False


qdrant_service = QdrantService()
