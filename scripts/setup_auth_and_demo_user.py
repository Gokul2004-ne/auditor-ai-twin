import httpx
import os
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://dkpcclyyuqzseqqmfqvh.supabase.co")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
MANAGEMENT_TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "dkpcclyyuqzseqqmfqvh")

# 1. Create SQL Trigger for new users
TRIGGER_SQL = """
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    default_org_id uuid;
    new_profile_id uuid;
    user_name text;
BEGIN
    -- Determine user name from metadata
    user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

    -- Insert into profiles
    INSERT INTO public.profiles (id, auth_user_id, full_name, email, created_at, updated_at)
    VALUES (gen_random_uuid(), new.id, user_name, new.email, now(), now())
    RETURNING id INTO new_profile_id;

    -- Get or create default organization
    SELECT id INTO default_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
    IF default_org_id IS NULL THEN
        INSERT INTO public.organizations (id, name, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Acme Analytical Laboratories Inc.', now(), now())
        RETURNING id INTO default_org_id;
    END IF;

    -- Add to organization_members
    INSERT INTO public.organization_members (id, organization_id, user_id, role)
    VALUES (gen_random_uuid(), default_org_id, new_profile_id, 'auditor');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
"""

def main():
    print("[1/3] Setting up PostgreSQL trigger for automatic user profile & organization creation...")
    headers = {"Authorization": f"Bearer {MANAGEMENT_TOKEN}"}
    r = httpx.post(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        headers=headers,
        json={"query": TRIGGER_SQL}
    )
    print("  -> Trigger SQL execution status:", r.status_code)
    if r.status_code != 201:
        print("  -> Details:", r.text)

    print("\n[2/3] Creating/updating demo auditor user in Supabase Auth...")
    sb_admin = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    
    email = "auditor@isotwin.internal"
    password = "AuditorPass123!"

    # Check if user already exists
    users = sb_admin.auth.admin.list_users()
    existing_user = next((u for u in users if u.email == email), None)

    if existing_user:
        print(f"  -> User {email} already exists (ID: {existing_user.id}). Updating password...")
        sb_admin.auth.admin.update_user_by_id(
            existing_user.id,
            {"password": password, "email_confirm": True, "user_metadata": {"full_name": "Lead ISO Auditor", "role": "auditor"}}
        )
        user_id = existing_user.id
    else:
        print(f"  -> Creating new user {email}...")
        res = sb_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": "Lead ISO Auditor", "role": "auditor"}
        })
        user_id = res.user.id
        print(f"  -> Created user {email} (ID: {user_id})")

    # Ensure profile and membership exist for this user
    prof_res = sb_admin.table("profiles").select("*").eq("auth_user_id", user_id).execute()
    if not prof_res.data:
        print("  -> Creating profile manually...")
        new_prof = sb_admin.table("profiles").insert({
            "auth_user_id": user_id,
            "full_name": "Lead ISO Auditor",
            "email": email,
        }).execute()
        prof_id = new_prof.data[0]["id"]
    else:
        prof_id = prof_res.data[0]["id"]
        print(f"  -> Found profile (ID: {prof_id})")

    org_res = sb_admin.table("organizations").select("id").limit(1).execute()
    if org_res.data:
        org_id = org_res.data[0]["id"]
        mem_res = sb_admin.table("organization_members").select("*").eq("user_id", prof_id).execute()
        if not mem_res.data:
            sb_admin.table("organization_members").insert({
                "organization_id": org_id,
                "user_id": prof_id,
                "role": "auditor"
            }).execute()
            print("  -> Linked auditor to default organization")

    print("\n[3/3] Testing Login with Client SDK (Anon Key)...")
    sb_client = create_client(SUPABASE_URL, ANON_KEY)
    login_res = sb_client.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    print(f"  -> Login SUCCESS! User: {login_res.user.email}, Session Token: {login_res.session.access_token[:25]}...")

if __name__ == "__main__":
    main()
