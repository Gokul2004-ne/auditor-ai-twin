import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Body
from app.services.document_service import document_service
from app.services.supabase_service import supabase_service
from app.api.deps import CurrentUser

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("", status_code=201)
async def upload_document(
    audit_id: str = Form(...),
    file: UploadFile = File(...),
    user: CurrentUser = None,
):
    if file.content_type not in ("application/pdf", "application/octet-stream") and not (file.filename and file.filename.lower().endswith(".pdf")):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    org_id = user.get("organization_id") or user.get("id", "")
    return await document_service.process_pdf(
        file_bytes=file_bytes,
        filename=file.filename or "document.pdf",
        audit_id=audit_id,
        organization_id=org_id,
        uploaded_by=user["id"],
    )


@router.post("/upload-init")
async def upload_init(
    audit_id: str = Body(..., embed=True),
    filename: str = Body(..., embed=True),
    file_size: int = Body(..., embed=True),
    user: CurrentUser = None,
):
    """Initialize an upload session and get a storage path."""
    doc_id = str(uuid.uuid4())
    org_id = user.get("organization_id") or user.get("id", "")
    storage_path = f"{org_id}/{audit_id}/{doc_id}/{filename}"
    
    # Pre-create document record
    doc = await supabase_service.create_document({
        "id": doc_id,
        "organization_id": org_id,
        "audit_id": audit_id,
        "file_name": filename,
        "storage_path": storage_path,
        "mime_type": "application/pdf",
        "file_size": file_size,
        "processing_status": "pending",
        "uploaded_by": user["id"],
    })
    return {
        "document_id": doc_id,
        "storage_path": storage_path,
        "bucket": "audit-documents",
        "document": doc,
    }


@router.post("/{document_id}/process")
async def process_document_by_id(
    document_id: str,
    background_tasks: BackgroundTasks,
    user: CurrentUser = None,
):
    """Trigger background or inline extraction and chunk embedding for a document."""
    doc = await supabase_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Download from storage
        pdf_bytes = await supabase_service.download_file("audit-documents", doc["storage_path"])
        # Process
        res = await document_service.process_pdf(
            file_bytes=pdf_bytes,
            filename=doc.get("file_name", "document.pdf"),
            audit_id=doc["audit_id"],
            organization_id=doc["organization_id"],
            uploaded_by=user["id"],
        )
        return {"status": "completed", "result": res}
    except Exception as e:
        await supabase_service.update_document_status(document_id, "failed")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("")
async def list_documents(audit_id: str, user: CurrentUser):
    return await supabase_service.list_documents(audit_id)


@router.get("/{document_id}")
async def get_document(document_id: str, user: CurrentUser):
    doc = await supabase_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: str, user: CurrentUser):
    await document_service.delete_document(document_id)
