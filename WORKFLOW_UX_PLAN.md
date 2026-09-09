# Workflow UX review and upgrade plan

Date: 10 September 2026. Keep YardPilot and the burgundy / white / light-grey palette.

Historical review: this document records the earlier assessment and plan. The user subsequently approved React and all six workstreams. See `UPGRADE_STATUS.md` for the current implementation, verification and rollout requirements; the deferrals and unimplemented-feature notes below describe the earlier state.

## What was wrong in the supplied screen

The condition panel was a largely presentational component, not the operational workflow. Its Print, PDF, Assign Repair, Mark Repaired and upload tiles had no handlers. It invented a minimum of one defect, inferred all repairs were complete from the wagon status, and displayed a hard-coded employee, fabricated memo number and four-hour estimate. Its timeline independently rendered saved stages. This explains how “Resolved / Fit Ready” could appear alongside zero condition details and an entirely pending timeline.

These findings are from source inspection. The actual database record for wagon 40059961419 has not been inspected or changed; screenshots and browser tests use sample data. A real certified record with missing evidence needs a reviewed correction, not automatic stage completion.

## Implemented now

- Replaced that panel with Overview, Repairs and Workflow sections, a scrollable body and mobile-safe footer.
- Repair counts come from saved task statuses. Zero tasks stays zero; missing tasks never imply a passed inspection. Legacy repair names are retained with stable identities until saved.
- Added working repair creation/editing, status and severity controls, location, reporter, notes, visible save errors and duplicate-name-safe task updates. A changed record must be reopened before an edit is saved.
- Both the condition panel and passport use the same repair editor and workflow controller. Removed dead bulk-completion and pretend-upload controls from the condition panel.
- Made workflow creation explicit. Viewing a wagon no longer writes a workflow automatically. Fixed the passport crash when no workflow exists.
- Added an explicit current-step action: Start, Pause, Resume, Complete or Continue to next stage. Branch selection is required where configured. A failed advance can be retried after reload without completing the previous stage twice.
- Certified/released workflows are read-only. Missing evidence or incompatible legacy stage names produces a review warning, not fabricated progress or a silent reset.
- Corrected canonical stage-to-queue matching, including DE_GASSING and POST_REPAIR_EXAM, and reused that matching in stage reports. Workshop line cards now open the same work process instead of a second completion implementation.
- Made the phone passport section selector explicit, kept tab selection in the URL, and removed the misleading Register selector from the passport.
- Removed additional fabricated passport values and the “clean bill of health” claim for empty repair records. Repair Complete is no longer counted as Fit in the register.
- Labelled the existing document feature honestly as a session-only local preview, added file-type checks and accessible controls. Server-backed document storage is not implemented by this change.

## Target process

The following is a product-navigation model, not a replacement safety SOP. Exact steps and branches must continue to use the configured wagon-family definitions in `shared/workflowDefinitions.json`, with domain-owner approval for changes.

Intake / identification → inspection and defect recording → applicable preparation and branch selection → assigned repairs → testing and final inspection → authorized fitness confirmation → release and archive.

Every active wagon should expose: current stage, responsible person, recorded evidence, blockers, and one next action. Repair-task completion, workflow completion, fitness certification and physical release must remain distinct.

## Menu-by-menu review

“Checked” below means source review and/or the specified browser scenarios, not exhaustive production acceptance.

| Menu / screen | Review result | Next UX/workflow improvement |
| --- | --- | --- |
| Home | Responsive entry screen checked; links and current counts render | Group work needing action by blocked, unassigned and awaiting approval; link each count to the exact filtered queue |
| Wagons: register and directory | Responsive routes checked; false fit counting and condition summary corrected | Replace remaining legacy display adapters and placeholder decoded wagon values with one canonical wagon view model |
| Wagons: passport / condition | Deep interaction tests added; repairs, workflow, empty record and failure recovery fixed | Add a single progress/evidence summary and clear readiness checklist before fitness approval |
| Wagons: quick entry | Route and current entry layout checked | Draft preservation, inline row validation, duplicate detection, and explicit partial-save recovery |
| Wagons: archives | Route checked; server records and browser-local legacy archives coexist | Separate data sources visibly and provide a reviewed legacy import/reconciliation flow |
| Workshop overview and all six lines | Queue mapping corrected; one shared work action path | Add persistent assignee, due time, pause reason, and “My work” filters with an approved data model |
| Live board | Responsive entry checked; separate legacy desktop presentation remains | Derive all lanes and actions from the same stage resolver; prohibit drag/drop bypass of prerequisites |
| Memos: active, archived, sick and fit entry | Route variants checked; existing labelled form and navigation tests pass | Guided linkage from the wagon, eligibility warnings, draft recovery, approval-role acceptance tests and a reliable print review |
| Reports: overview and builder | Overview CSV tested; stage-name matching corrected | Audit every filter against returned rows. Released report currently mixes Fit Ready with Released and relies on “Final” stage-name matching. Workshop/department controls need verified data bindings. Separate certification and release timestamps |
| Administration: staff, approvals, users and roles | Permission-aware navigation and route variants checked | Standardize pending/error/retry states and require clear confirmation for account-impacting actions; test real role transitions on staging |
| Administration: master data | Category screen and route checked | Show which runtime forms consume each category; separate editable display data from safety workflow definitions |
| Administration: audit and deleted records | Both tab URLs checked | Add before/after evidence, correction reason and safe record recovery links; reconcile the workflow correction experience |
| Profile, preferences and Help | Routes and shared navigation checked | Consistent save-in-progress feedback, unsaved-change warnings, contextual help from blocked workflow steps |
| Authentication / session handling | Existing expired-session, temporary-password and load-error regressions pass | Validate keyboard/screen-reader flows and slow-network recovery on staging |

## Ordered implementation plan

### 1. Data integrity and recovery — highest priority

- Inventory old workflow identifiers, certified wagons with incomplete evidence, orphan repair tasks and inconsistent stage/status pairs using read-only checks.
- Produce a dry-run reconciliation report and backup before any migration. Do not auto-mark historical stages complete.
- Design an administrator reopen/correct flow with a required reason, before/after audit trail and concurrency checks.
- Make complete-and-advance one idempotent server operation; retain the current recoverable two-step UI until that API is ready.
- Acceptance: all supported wagon families complete their legitimate paths; invalid branches, stale edits and unauthorized certification fail visibly; interrupted requests can be safely retried.

### 2. Work execution and evidence

- Add real assignment to an approved account, handoff notes, due time and blocked reason. Do not relabel “reported by” as “assigned to.”
- Build server-backed document storage with per-wagon authorization, type/size validation, scanning, version history, durable metadata and authorized downloads. Confirm retention and storage requirements before deployment.
- Connect required evidence and maintenance checks to a fitness-readiness summary. Present remaining blockers before the user fills the confirmation form.
- Acceptance: another authorized staff member can see saved assignments and evidence after signing in on another device; unauthorized users cannot access documents.

### 3. Consistent menus and reporting

- Consolidate live board, line queues, passport and dashboard around one stage/status model.
- Finish intake and memo drafts, exact filter links and visible loading/error/empty states.
- Correct the remaining report semantics and timestamps, replace browser prompts/reloads with accessible dialogs, and verify PDF/CSV/Excel/print totals agree.
- Acceptance: the same wagon, stage, counts and eligibility appear across every menu; Back/Forward preserves context and drafts.

### 4. Release validation

- Staging end-to-end runs against the real API for employee, admin and super-admin roles; no production test mutations.
- Cover every configured workflow branch, pause/resume, failed saves, concurrent editors, evidence upload, certification, release and archived lookup.
- Physical Android and iPhone checks, Safari, keyboard-only navigation, screen reader labels, zoom and slow/interrupted network testing.
- Retain the current responsive regression suite. Fix existing repository-wide lint debt and bundle-size warnings separately; do not bundle a React upgrade into this work.

## Verification and previews

- Production build, 15 frontend unit tests, 14 backend regressions and 25 Chromium browser tests passed. Targeted lint checks for the rewritten condition/workflow components passed; repository-wide lint debt remains.
- Chromium route checks cover 31 URLs at 360, 390, 768 and 1440 pixels, plus all six passport sections at those widths.
- Focused tests cover inconsistent fit evidence, same-name repair identity, save failure, reload persistence, missing workflows, failed-advance recovery, tank branch choice and narrow-screen sheet/search behavior.
- Tests use mocked browser API data and an isolated backend test database, not the production wagon record. Physical-device, Safari and exhaustive accessibility verification remain outstanding.
- Implemented screenshots: `docs/ui/workflow-390.png`, `docs/ui/workflow-1440.png`, `docs/ui/condition-mobile.png` and `docs/ui/condition-desktop.png`.

No deployment, commit, production data migration or framework upgrade was performed.
