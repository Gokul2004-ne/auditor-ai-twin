from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging import logger
from app.services.neo4j_service import neo4j_service
from app.services.qdrant_service import qdrant_service
from app.services.gemini_service import gemini_service

from app.api.routes import health, standards, clauses, search, audits, documents, findings, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown of external connections."""
    logger.info("Starting Auditor AI Twin backend...")

    # Connect to Neo4j
    try:
        await neo4j_service.connect()
        logger.info("✓ Neo4j connected")
    except Exception as e:
        logger.error(f"✗ Neo4j connection failed: {e}")

    # Connect to Qdrant
    try:
        await qdrant_service.connect()
        logger.info("✓ Qdrant connected")
    except Exception as e:
        logger.error(f"✗ Qdrant connection failed: {e}")

    # Configure Gemini
    try:
        gemini_service.configure()
        logger.info("✓ Gemini configured")
    except Exception as e:
        logger.error(f"✗ Gemini configuration failed: {e}")

    yield  # Application runs here

    logger.info("Shutting down...")
    await neo4j_service.close()
    await qdrant_service.close()
    logger.info("Connections closed")


# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])

app = FastAPI(
    title="Auditor AI Twin",
    description="AI-powered audit management platform with ISO standard graph analysis",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://localhost:8001",
        "https://novaaudit.novaarctech.in",
    ],
    allow_origin_regex=r"https://.*\.github\.io|https://.*\.railway\.app|https://.*\.novaarctech\.in|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# Root health
@app.get("/health")
async def root_health():
    return {
        "api": "ok",
        "supabase": "ok",
        "neo4j": "ok" if neo4j_service.driver is not None else "error",
        "qdrant": "ok" if qdrant_service.health_check() else "error",
        "gemini": "ok" if gemini_service.health_check() else "error",
    }


# Include routers under /api and /api/v1
for prefix in ("/api", "/api/v1"):
    app.include_router(health.router, prefix=prefix)
    app.include_router(standards.router, prefix=prefix)
    app.include_router(clauses.router, prefix=prefix)
    app.include_router(search.router, prefix=prefix)
    app.include_router(audits.router, prefix=prefix)
    app.include_router(documents.router, prefix=prefix)
    app.include_router(findings.router, prefix=prefix)
    app.include_router(reports.router, prefix=prefix)


@app.get("/")
async def root():
    return {"name": "Auditor AI Twin API", "version": "1.0.0", "docs": "/docs"}
