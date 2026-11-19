"""Integration tests for Auditor AI Twin backend services."""
import asyncio
import pytest
import os
from dotenv import load_dotenv

load_dotenv()


@pytest.mark.asyncio
async def test_neo4j_connection():
    from app.services.neo4j_service import neo4j_service
    await neo4j_service.connect()
    result = await neo4j_service.run_query("RETURN 1 AS n")
    assert result[0]["n"] == 1
    await neo4j_service.close()


@pytest.mark.asyncio
async def test_neo4j_standards():
    from app.services.neo4j_service import neo4j_service
    await neo4j_service.connect()
    standards = await neo4j_service.get_all_standards()
    print(f"Found {len(standards)} standards: {[s.get('name') for s in standards]}")
    await neo4j_service.close()


@pytest.mark.asyncio
async def test_qdrant_connection():
    from app.services.qdrant_service import qdrant_service
    await qdrant_service.connect()
    info = await qdrant_service.get_collection_info()
    print(f"Qdrant collection: {info}")
    await qdrant_service.close()


@pytest.mark.asyncio
async def test_gemini_embedding():
    from app.services.gemini_service import gemini_service
    embedding = await gemini_service.generate_embedding("ISO 27001 information security management")
    assert len(embedding) > 0
    print(f"Embedding dimension: {len(embedding)}")


@pytest.mark.asyncio
async def test_full_pipeline():
    """Test the full document → embed → search pipeline."""
    from app.services.neo4j_service import neo4j_service
    from app.services.qdrant_service import qdrant_service
    from app.services.gemini_service import gemini_service

    await neo4j_service.connect()
    await qdrant_service.connect()

    test_text = "The organization shall establish an information security policy."
    embedding = await gemini_service.generate_embedding(test_text)

    # Upsert a test vector
    await qdrant_service.upsert_chunks(
        [{"text": test_text, "document_id": "test-doc", "audit_id": "test-audit",
          "organization_id": "test-org", "chunk_index": 0, "metadata": {}}],
        [embedding],
    )

    # Search for it
    results = await qdrant_service.search(
        query_vector=embedding,
        organization_id="test-org",
        limit=1,
    )
    assert len(results) > 0
    print(f"Search hit: {results[0]['text'][:50]}")

    await neo4j_service.close()
    await qdrant_service.close()


if __name__ == "__main__":
    asyncio.run(test_neo4j_connection())
    asyncio.run(test_qdrant_connection())
    asyncio.run(test_gemini_embedding())
    print("All integration tests passed!")
