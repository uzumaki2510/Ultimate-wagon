# Security and reliability changes

## Deployment requirements

- Use Node.js 22. Install the root lockfile with `npm ci`; install the backend with `npm ci --prefix server`. React 19 and Router 7 were explicitly approved and upgraded; the current installed dependency tree passes `npm ls --all --omit=dev`.
- MongoDB must be a replica set or sharded cluster. Maintenance changes and their audit entries now commit in one transaction. Standalone MongoDB is intentionally rejected at startup. Back up the existing database and test deployment against a staging copy first.
- Deploy the frontend and API on the same site, preferably with `/api/v1` reverse-proxied to the backend. Set `FRONTEND_URL` to the exact frontend origin, without a trailing slash. Production requires HTTPS because refresh cookies are Secure, HttpOnly and SameSite=Strict. Cross-site frontend/API hosting will not retain these sessions.
- Set distinct, random `JWT_SECRET` and `JWT_REFRESH_SECRET` values of at least 32 characters. Existing JWTs and stored legacy refresh tokens are invalidated by this rollout; users must log in again. Never commit `.env` files.
- New and reset passwords require at least 12 characters and at most 72 UTF-8 bytes. Temporary-password users must change their password before operational access. Email reset delivery is not configured; use the authorized administrator reset process.
- Do not run the seed script on an existing production database. No production database or migration was accessed during this change.

## Implemented controls

- Pending, rejected, inactive and revoked sessions are rejected by API authentication. Session refresh uses rotating, hashed refresh tokens in HTTP-only cookies, and logout revokes access tokens. Stale browser responses are rejected after logout.
- Administrative routes enforce target-role restrictions, operational APIs enforce role permissions, and staff cannot certify or release wagons. Approval/signature identity is server-derived.
- The server owns workflow definitions, transition checks, prerequisite checks, completion timestamps and audit records. Fitness requires a completed workflow, repaired defects and explicit signed confirmation. Concurrent edits return a conflict instead of silently overwriting records.
- Wagon IDs come from the database. Checklists, repair metadata, memos, rakes and workflow progress persist before the UI confirms success. Wagon loading traverses all pages. Deletion is recoverable through the server's deleted register.
- Search input is treated as literal text. Production errors hide internal details. CSV formulas and report HTML are escaped. The vulnerable SheetJS dependency was replaced with an export-only ExcelJS adapter.
- The approval roster uses approved accounts rather than locally invented signers.

## Verification and remaining work

See `UPGRADE_STATUS.md` for current verification counts and the six-workstream implementation. Production build and `git diff --check` pass. These are regression checks, not exhaustive application coverage.

Run `npm test`, `npm test --prefix server`, `npm run test:e2e`, and `npm run build`. Backend tests create a disposable MongoDB replica set; they never use the configured application database. Browser tests use mocked APIs and cover session gating, load failure and checklist persistence. Install Chrome for browser tests (`npx playwright install chrome`). CI runs these checks.

This is not a claim that every project bug has been eliminated. Existing lint debt remains (341 errors and 8 warnings at the recorded check, primarily explicit `any` and unused code), along with large export bundles. The older browser/Jest scenarios are retained but are not included in the new focused regression suites. Document attachments now use authenticated MongoDB storage, version metadata and fail-closed scanning; configure the private ClamAV service before enabling downloads. Previous browser-only previews are not automatically imported. Supplemental legacy maintenance endpoints need further transactional-audit coverage.

Legacy stored workflow/status values should be reviewed in staging before rollout: do not automatically certify or fabricate inspection history while migrating them to the canonical definitions. No automatic production-data conversion is included.

Dependency audit after the user-approved React/Router upgrade: `npm audit --omit=dev` reports zero findings in both frontend and backend production trees. This is not a complete security audit. Backups, TLS, production configuration and staging role checks still require deployment-owner verification.
