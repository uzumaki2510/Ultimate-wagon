# React and six-point upgrade

Completed locally on 10 September 2026. User approval superseded the earlier React deferral. YardPilot retains the burgundy / white / light-grey palette.

## Delivered

| Area | Implemented result | Local acceptance |
| --- | --- | --- |
| React | React / React DOM 19.3.0, Router 7.18.3, DayPicker 9.14.0; compatible types, theme and drawer packages; migrated calendar/table APIs | Build, installed peer tree and browser regression checks pass |
| 1. Workflow consistency | Transactional complete-and-advance with retry receipts, optimistic conflicts, integrity review, reasoned legacy normalization and certified-record reopening | All five configured families, tank alternatives, LPG return/rework cycles, stale edits, audit rollback and unauthorized certification tested |
| 2. Shared workspace | Dashboard, workshop list, live board and six line queues share the same stage model and wagon cards; condition panel and passport share work controls | Matching queue links, no alternate drag/drop bypass, one current work action |
| 3. Assignments and handoffs | Approved-account assignment, self-claim, due time, blockers, handoff notes/history and My Work / blocked / overdue / unassigned views | Persistence across reload, ownership permissions, blocker enforcement and conflict handling tested |
| 4. Documents and evidence | MongoDB-backed file content and metadata, authenticated access, per-wagon versions, 5 MB signature validation, quarantine/scanning, protected downloads and withdrawal; saved readiness checks before certification | Upload/reload, metadata, versions, scanner protocol and download restrictions tested; live scanner configuration remains a rollout requirement |
| 5. Reports | One calculation for screen / CSV / Excel / PDF / print, working combined filters, archived history, separate certification/release timestamps, historical work cycles, saved browser filter presets | Date semantics, missing dates, selected filters and all three downloaded formats tested |
| 6. Mobile and performance | Task-first responsive queues, mobile passport selector, error/retry states, page error boundary, deferred search, bounded visible cards, indexed workflow lookups, cached React vendor chunk and lazy export libraries | 32 route variants and six passport sections checked at 360, 390, 768 and 1440 px; no horizontal overflow in tested views |

The LPG configuration contains an explicit return from Purging to HAPA Depot. Returning now requires a reason, preserves the prior affected stage evidence in cycle history, and resets the returned work for a fresh pass. The forward exit no longer mistakes an earlier completed depot for the selected next route. Configured SOP stage definitions were not changed.

## Verification

- Frontend: 27 unit tests pass.
- Backend: 22 tests pass using a disposable MongoDB replica set, including end-to-end API transactions and all workflow-family routes.
- Browser: 31 Chromium regression tests pass against both the development server and the minified production build using mocked API fixtures, including all menu routes, mobile widths, failed saves, assignments, evidence, exports and LPG exit behavior. Together with frontend and backend checks, this is 80 distinct regression tests.
- Production build passes. Targeted lint for the new workspace/report/evidence components and `git diff --check` pass; repository-wide pre-existing lint debt remains.
- `npm ls --all --omit=dev` succeeds. `npm audit --omit=dev` reports zero known vulnerabilities in both frontend and backend production dependency trees.
- Main application chunk is approximately 408 KB minified, plus a separately cached 224 KB React vendor chunk. ExcelJS remains a roughly 940 KB lazy export chunk; this is not a claim that total download size fell by the vendor split alone.
- Browser API fixtures and the isolated backend suite are complementary; this is not a staging test with real production data or a complete security/accessibility certification.

## Rollout requirements — not performed automatically

1. Back up the existing database and deploy to a staging replica set first. Do not run the seed script or auto-complete old stages.
2. Create/verify the new indexes during deployment: unique `WorkflowOperation.key`, unique `WagonDocument(wagonId, version)`, and the other model indexes. Production index creation should be reviewed against the database's existing contents.
3. Configure a private ClamAV service using `CLAMAV_HOST` and `CLAMAV_PORT` (default 3310). Keep that service off the public internet. No scanner was installed or contacted outside the test fixture. Without configuration, uploads are stored in quarantine and downloads remain blocked; scanner failure does not mark files clean.
4. Confirm database capacity, backup/restore and document retention policy with the owner. File versions and withdrawn content are retained. Earlier browser-only previews are not imported automatically.
5. Use Administration → Workflow integrity to review actual historical records. Only an administrator's explicit reasoned action normalizes unambiguous stage names; missing stages remain Pending. Unknown/ambiguous history needs manual review. No production record, including wagon 40059961419, was changed.
6. Validate the real employee/admin/super-admin roles, physical iPhone/Android devices, Safari, keyboard/screen-reader use, slow-network behavior, and the organization's evidence/sign-off SOP on staging before release.

No deployment or production migration was performed.

## Deferred diagram alignment — 10 September 2026

The user requested committing the current implementation and deferring alignment with the supplied BTPN flowchart and BTPGLN purging/degassing diagram. The regression tests verify the configured application routes, not exact conformity to those diagrams.

- BTPN: review the cleaning/placement sequence, enforce the indicated 24-hour period once its timing rules are confirmed, and clarify rectification and MV-shed/ROH sick-line routing.
- BTPGLN: align initial work classification and the upper-gear-specific return route for sickness during purging; confirm the ROH/POH return path, which is not connected in the supplied diagram, and the CC-type BPC requirement before final fitness for loading.
- Confirm the approved workflow mapping and evidence requirements before changing stage definitions or migrating historical records. No diagram-alignment changes have been implemented.

## CI correction and branding follow-up — 10 September 2026

The failed [GitHub Actions job](https://github.com/uzumaki2510/Ultimate-wagon/actions/runs/34410893578/job/102664785359) reached the backend tests after successful dependency installation, production build and frontend tests. Its MongoDB fixture requested `mongodb-linux-x86_64-ubuntu2404-7.0.14.tgz`, which returned HTTP 403 before application assertions could run. The local workflow now pins `ubuntu-22.04`; the matching `ubuntu2204-7.0.14.tgz` archive was verified to return HTTP 200. The CI build explicitly uses `/api/v1` for mocked browser tests. This correction is local until committed and pushed; the original remote failed run has not been rerun.

The displayed application name is now RailFlow, and the login-page imagery has been removed at the user's request. Existing saved browser preference keys are preserved. Current login previews and scope are documented in `docs/ui/LOGIN_DESIGN.md`. The full local verification passes: 27 frontend tests, 22 backend tests and 40 browser tests against the production build (89 total). The browser suite also refreshes its workspace and condition preview screenshots.

## Preview files

- `docs/ui/upgraded-work-queue.png`
- `docs/ui/upgraded-dashboard-mobile.png`
- `docs/ui/upgraded-board-mobile.png`
- `docs/ui/workflow-390.png` and `docs/ui/workflow-1440.png`

These are screenshots of the actual implementation with sample data, not production records.

Migration references: [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide), [DayPicker migration guide](https://daypicker.dev/upgrading).
