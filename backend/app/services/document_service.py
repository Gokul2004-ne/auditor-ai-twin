from __future__ import annotations

import io
import logging
import math
from typing import Any, Optional

from app.services.supabase_service import supabase_service
from app.services.gemini_service import gemini_service
from app.services.qdrant_service import qdrant_service

logger = logging.getLogger("audit_twin.document")

CHUNK_SIZE = 1000  # characters
CHUNK_OVERLAP = 150


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    if not text.strip():
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
        if start >= len(text):
            break
    return chunks


class DocumentService:
    async def process_pdf(
        self,
        file_bytes: bytes,
        filename: str,
        audit_id: str,
        organization_id: str,
        uploaded_by: str,
    ) -> dict[str, Any]:
        """Full pipeline: extract text -> chunk -> embed -> store in Qdrant -> save metadata."""
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise RuntimeError("PyMuPDF not installed. Run: pip install PyMuPDF")

        # Extract text from PDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        full_text = ""
        page_texts = []
        for page_num, page in enumerate(doc):
            page_text = page.get_text("text")
            page_texts.append({"page": page_num + 1, "text": page_text})
            full_text += f"\n[Page {page_num + 1}]\n{page_text}"
        doc.close()

        total_pages = len(page_texts)
        logger.info(f"Extracted {total_pages} pages from {filename}")

        # Upload raw PDF to Supabase storage
        storage_path = f"{organization_id}/{audit_id}/{filename}"
        try:
            pdf_url = await supabase_service.upload_file(
                "audit-documents", storage_path, file_bytes, "application/pdf"
            )
        except Exception as e:
            logger.warning(f"Storage upload failed (continuing): {e}")
            pdf_url = None

        # Save document metadata
        from app.core.security import hash_content
        content_hash = hash_content(file_bytes)

        document_record = await supabase_service.create_document({
            "audit_id": audit_id,
            "organization_id": organization_id,
            "file_name": filename,
            "storage_path": storage_path,
            "file_hash": content_hash,
            "file_size": len(file_bytes),
            "mime_type": "application/pdf",
            "page_count": total_pages,
            "processing_status": "processing",
            "uploaded_by": uploaded_by if uploaded_by and len(uploaded_by) == 36 else None,
        })
        document_id = document_record.get("id", "unknown")

        # Chunk the text
        chunks = chunk_text(full_text)
        logger.info(f"Created {len(chunks)} chunks from {filename}")

        # Generate embeddings in batch
        embeddings = await gemini_service.generate_embeddings_batch(chunks)

        # Prepare Qdrant payloads
        qdrant_chunks = [
            {
                "text": chunk,
                "document_id": document_id,
                "audit_id": audit_id,
                "organization_id": organization_id,
                "filename": filename,
                "chunk_index": i,
                "metadata": {"total_chunks": len(chunks)},
            }
            for i, chunk in enumerate(chunks)
        ]

        # Upsert to Qdrant
        upserted = qdrant_service.upsert_chunks(qdrant_chunks, embeddings)
        logger.info(f"Upserted {upserted} vectors to Qdrant")

        # Update document status
        await supabase_service.update_document(document_id, {
            "processing_status": "completed",
        })

        return {
            "id": document_id,
            "document_id": document_id,
            "file_name": filename,
            "filename": filename,
            "total_pages": total_pages,
            "chunk_count": len(chunks),
            "pdf_url": pdf_url,
            "status": "ready",
        }

    async def delete_document(self, document_id: str) -> bool:
        """Delete document and its vectors."""
        qdrant_service.delete_by_document(document_id)
        doc = await supabase_service.get_document(document_id)
        if doc:
            await supabase_service.update_document(document_id, {"processing_status": "deleted"})
        return True

    async def search_document_context(
        self,
        query: str,
        organization_id: str,
        audit_id: Optional[str] = None,
        document_id: Optional[str] = None,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """Search document context using vector similarity."""
        query_embedding = await gemini_service.generate_embedding(query, task_type="RETRIEVAL_QUERY")
        return qdrant_service.search(
            query_vector=query_embedding,
            organization_id=organization_id,
            audit_id=audit_id,
            document_id=document_id,
            limit=limit,
        )


document_service = DocumentService()
