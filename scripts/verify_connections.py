#!/usr/bin/env python3
"""Verify all service connections for Auditor AI Twin."""
import os
import sys
from pathlib import Path

# Load from backend .env
env_file = Path(__file__).parent.parent / "backend" / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            key, _, value = line.partition('=')
            os.environ[key.strip()] = value.strip()

def check_neo4j():
    try:
        from neo4j import GraphDatabase
        uri = os.environ.get("NEO4J_URI")
        user = os.environ.get("NEO4J_USERNAME")
        password = os.environ.get("NEO4J_PASSWORD")
        database = os.environ.get("NEO4J_DATABASE", "30b20a56")
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        with driver.session(database=database) as session:
            result = session.run("RETURN 1 AS n")
            result.single()
        driver.close()
        return True, "Connected"
    except Exception as e:
        return False, str(e)[:120]

def check_qdrant():
    try:
        from qdrant_client import QdrantClient
        url = os.environ.get("QDRANT_URL")
        api_key = os.environ.get("QDRANT_API_KEY")
        client = QdrantClient(url=url, api_key=api_key)
        client.get_collections()
        return True, "Connected"
    except Exception as e:
        return False, str(e)[:120]

def check_gemini():
    try:
        import urllib.request, json
        api_key = os.environ.get("GEMINI_API_KEY")
        model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        data = json.dumps({"contents": [{"parts": [{"text": "ping"}]}]}).encode("utf-8")
        req = urllib.request.Request(url, headers={"Content-Type": "application/json"}, data=data)
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            if "candidates" in res:
                return True, "Connected"
        return False, "Invalid response"
    except Exception as e:
        return False, str(e)[:120]

def check_supabase():
    try:
        from supabase import create_client
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        client = create_client(url, key)
        client.table("organizations").select("id").limit(1).execute()
        return True, "Connected"
    except Exception as e:
        return False, str(e)[:120]

if __name__ == "__main__":
    print("=" * 60)
    print("      Auditor AI Twin — Live Connection Verification")
    print("=" * 60)
    
    checks = {
        "Supabase": check_supabase,
        "Neo4j": check_neo4j,
        "Qdrant": check_qdrant,
        "Gemini": check_gemini,
    }
    
    all_ok = True
    for name, check_fn in checks.items():
        ok, msg = check_fn()
        status = "OK" if ok else "FAILED"
        print(f"  {name:<12} {status:<8} ({msg})")
        if not ok:
            all_ok = False
    
    print("=" * 60)
    if all_ok:
        print("  All connections verified successfully!")
    else:
        print("  Some connections failed. Check credentials.")
    sys.exit(0 if all_ok else 1)
