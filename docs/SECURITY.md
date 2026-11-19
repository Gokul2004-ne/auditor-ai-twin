# Security & Digital Signature Verification

The Auditor AI Twin implements enterprise security, tenant isolation, and cryptographic non-repudiation.

---

## 1. Authentication & Authorization

- **Supabase Auth JWT**: All requests between the Next.js frontend and FastAPI orchestration service transmit the user's Supabase JWT:
  ```http
  Authorization: Bearer <supabase_access_token>
  ```
- **FastAPI Token Verification**: FastAPI decodes the token, extracts the authenticated user profile, and retrieves the auditor's organization memberships.
- **Tenant Validation**: Every CRUD operation automatically validates that the requested resource belongs to the user's authorized `organization_id`.

---

## 2. Cryptographic Digital Signatures & Integrity

1. **Immutable Report Finalization**:
   - Compiles the official ReportLab PDF.
   - Computes the SHA-256 hash of the generated PDF bytes.
   - Locks the report state from `draft` to `finalized`.
2. **Signature Stamping**:
   - The Lead Auditor draws their signature or uploads an authorized signature image.
   - PyMuPDF stamps the signature image, signer name, role, timestamp, and verification badge onto the PDF.
   - An entry is inserted into the `digital_signatures` table.
3. **Public Verification (`/verify/[reportId]`)**:
   - Anyone holding the report ID or QR code can verify the document's authenticity.
   - The verification service compares the stored SHA-256 digest against the signed ledger, proving the document has not been altered or tampered with.
