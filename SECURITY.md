# Security Policy

## Supported Versions

Currently, only the latest release of Wagon Whisper is supported with security updates. 

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within the Wagon Whisper application, please DO NOT disclose it publicly. We take security very seriously and will address all issues immediately.

Please report vulnerabilities by contacting the repository owner directly.

### Information to Include:
* Description of the vulnerability.
* Steps to reproduce.
* Potential impact.
* Suggested mitigation (if any).

### What to Expect:
* We will acknowledge receipt of your vulnerability report within 48 hours.
* We will send you regular updates about our progress in addressing it.
* We will notify you when the vulnerability is fixed.

## Security Features Built-In

Wagon Whisper enforces the following security protocols:

* **Authentication:** `bcrypt` (cost factor 12) for password hashing.
* **Authorization:** Strict backend-enforced RBAC (Super Admin, Admin, Employee).
* **JWT Rotation:** Expirations and automated refresh token rotation via HttpOnly secure mechanisms.
* **Brute Force Defense:** Account lockout triggers after 5 failed login attempts (15-minute cooldown).
* **NoSQL Injection Defense:** `express-mongo-sanitize` is utilized across all endpoints.
* **XSS Defense:** Custom payload sanitation strips malicious HTML scripts.
* **Rate Limiting:** Global rate limiting is applied via `express-rate-limit`.
* **Audit Logs:** Immutable audit ledger tracking all critical Admin and Super Admin actions.
