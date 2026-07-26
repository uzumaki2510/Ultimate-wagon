# Ultimate Wagon Whisper — File-Restricted Coding Prompts

Use one prompt at a time. Do not combine sections. Each prompt explicitly limits which files may be modified.

## Prompt 0 — Mandatory Safety Header

Paste this header before every future coding prompt:

```text
Work only inside the provided Ultimate Wagon Whisper project.

STRICT SCOPE RULES:
1. Modify only the files explicitly listed under ALLOWED FILES.
2. Do not modify, create, delete, move, rename, format, or regenerate any other file.
3. Do not change package.json, package-lock.json, environment files, build output, logs, node_modules, Git files, API contracts, routes, database schemas, UI text, or existing behavior unless explicitly listed.
4. Before editing, inspect the allowed files and state the exact intended changes.
5. If another file appears necessary, stop and report its path and reason. Do not edit it.
6. Preserve all existing functionality and visual behavior.
7. After editing, provide the exact changed-file list and validation results.
8. Do not commit or push changes.
```

## Prompt 1 — Create Frontend Feature Folders Only

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Create empty feature folders to prepare a cleaner frontend structure. Do not move or edit existing files.

ALLOWED FILES:
- New `.gitkeep` files only inside:
  - src/components/layout/
  - src/components/navigation/
  - src/components/wagons/
  - src/components/workflows/
  - src/components/memos/
  - src/components/reports/

REQUIREMENTS:
- Create only the listed folders and `.gitkeep` files.
- Do not change imports or application code.
- Confirm that the application source remains unchanged.
```

## Prompt 2 — Move Layout Components

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Move only the frontend layout/navigation components into dedicated folders and update only their direct imports. Do not alter component logic, markup, styles, props, or exports.

ALLOWED FILES:
- src/components/AppLayout.tsx
- src/components/AppSidebar.tsx
- src/components/NavLink.tsx
- src/components/layout/AppLayout.tsx
- src/components/navigation/AppSidebar.tsx
- src/components/navigation/NavLink.tsx
- src/App.tsx
- Any file that currently imports one of these three components, but only after listing the exact file before editing it

REQUIREMENTS:
- Perform path-only changes.
- Preserve default/named exports exactly.
- Do not reformat unrelated lines.
- Delete the old files only after imports compile.
```

## Prompt 3 — Organize Wagon Components

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Move the wagon-specific components into `src/components/wagons/` and update only import paths. Do not split, redesign, optimize, or change logic.

ALLOWED FILES:
- src/components/WagonInput.tsx
- src/components/WagonTable.tsx
- src/components/WagonDetailsDisplay.tsx
- src/components/EditWagonModal.tsx
- src/components/RepairTypeSelector.tsx
- Matching new paths under src/components/wagons/
- Files that directly import these components, only after listing them before editing

REQUIREMENTS:
- Path-only refactor.
- Preserve component names, props, behavior, UI, and exports.
- Do not modify API, store, types, CSS, or backend files.
```

## Prompt 4 — Organize Workflow Components

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Move only `BTPNWorkflow.tsx` and `BTPGLNWorkflow.tsx` into `src/components/workflows/` and update direct imports.

ALLOWED FILES:
- src/components/BTPNWorkflow.tsx
- src/components/BTPGLNWorkflow.tsx
- src/components/workflows/BTPNWorkflow.tsx
- src/components/workflows/BTPGLNWorkflow.tsx
- Files that directly import these two components, only after listing them before editing

REQUIREMENTS:
- Do not change workflow logic, statuses, transitions, API calls, UI, or types.
- Do not format unrelated code.
```

## Prompt 5 — Split EditWagonModal Safely

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Refactor `EditWagonModal.tsx` into smaller internal section components while preserving identical behavior and UI.

ALLOWED FILES:
- src/components/EditWagonModal.tsx OR src/components/wagons/EditWagonModal.tsx, whichever currently exists
- New files only inside src/components/wagons/edit-wagon/

TARGET SECTIONS:
- EditWagonHeader.tsx
- WagonIdentitySection.tsx
- WagonStatusSection.tsx
- RepairDetailsSection.tsx
- PlacementDetailsSection.tsx
- EditWagonActions.tsx
- types.ts, only if local component props require it

REQUIREMENTS:
- Keep data fetching, mutation, validation, submission, and modal open/close control in the parent.
- Child sections must be presentational and receive explicit props.
- Do not change field names, defaults, labels, validation, API payloads, notifications, or visual styling.
- Do not touch global types, API files, store files, backend files, or UI primitives.
```

## Prompt 6 — Split WagonTable Safely

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Refactor `WagonTable.tsx` into smaller table-specific components without changing columns, sorting, filters, actions, pagination, responsiveness, or styling.

ALLOWED FILES:
- src/components/WagonTable.tsx OR src/components/wagons/WagonTable.tsx, whichever currently exists
- New files only inside src/components/wagons/table/

TARGET SECTIONS:
- WagonTableHeader.tsx
- WagonTableRow.tsx
- WagonTableActions.tsx
- WagonMobileCard.tsx
- wagonTableColumns.tsx, only if column definitions currently exist in the parent

REQUIREMENTS:
- Parent retains data orchestration and state.
- Extract only clearly isolated rendering sections.
- Do not change API calls, store usage, types, displayed values, actions, or permissions.
```

## Prompt 7 — Split Workflow Files One at a Time

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Refactor only the specified workflow component into internal sections. Work on one workflow per execution.

ALLOWED FILES FOR THIS EXECUTION:
- [INSERT EXACT WORKFLOW FILE]
- New files only inside a sibling folder named after that workflow

TARGET SECTIONS:
- WorkflowHeader.tsx
- WorkflowProgress.tsx
- WorkflowForm.tsx
- WorkflowHistory.tsx
- WorkflowActions.tsx
- workflowTypes.ts, only if needed locally

REQUIREMENTS:
- Preserve every transition, status value, validation rule, request payload, permission check, message, and visual state.
- Do not create shared abstractions between BTPN and BTPGLN in this task.
- Do not touch the other workflow.
```

## Prompt 8 — Organize Frontend API Calls

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Review one frontend feature and move any direct HTTP calls from its page/component into its existing API module. Preserve requests and responses exactly.

ALLOWED FILES:
- [INSERT ONE PAGE OR COMPONENT FILE]
- [INSERT ONE EXISTING src/api/*.ts FILE]

REQUIREMENTS:
- Do not modify `src/api/client.ts`.
- Preserve method, URL, headers, parameters, request body, response handling, and errors.
- Do not change UI behavior or backend code.
- Do not apply this to multiple features in one task.
```

## Prompt 9 — Split Zustand Store by Domain, Phase 1

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Extract only wagon-related Zustand state and actions from `useAppStore.ts` into a wagon slice while preserving the public store API.

ALLOWED FILES:
- src/store/useAppStore.ts
- New files only inside src/store/slices/

REQUIREMENTS:
- Existing consumers must continue importing and calling `useAppStore` exactly as before.
- Do not change state names, action names, default values, selectors, persistence behavior, or side effects.
- Extract only the wagon domain in this task.
- Do not edit components, pages, APIs, types, or backend files.
```

## Prompt 10 — Split Shared Types One Domain at a Time

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Move only [INSERT DOMAIN] types from `src/types/index.ts` into `src/types/[DOMAIN].ts`, then re-export them from `src/types/index.ts` so existing imports remain valid.

ALLOWED FILES:
- src/types/index.ts
- src/types/[DOMAIN].ts

REQUIREMENTS:
- No consumer imports may change.
- Do not rename or alter any type, interface, enum, union, field, optional marker, or exported name.
- Process only one domain in this task.
```

## Prompt 11 — Backend Controller-to-Service Refactor

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Move business logic from one backend controller into its matching service while preserving all endpoint behavior and response formats.

ALLOWED FILES:
- server/src/controllers/[CONTROLLER].js
- server/src/services/[SERVICE].js
- A new service file only if no matching service exists

REQUIREMENTS:
- Do not modify routes, models, validation, middleware, constants, environment files, or tests.
- Controller must retain request parsing and response sending.
- Service must contain the extracted business/database logic.
- Preserve HTTP status codes, response body shape, error messages, audit behavior, database queries, sorting, pagination, and authorization assumptions.
- Refactor only one controller per task.
```

## Prompt 12 — Backend Feature Folder Migration

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Move one complete backend feature into a feature folder using path-only changes.

FEATURE:
[INSERT FEATURE NAME]

ALLOWED FILES:
- server/src/routes/[FEATURE ROUTE].js
- server/src/controllers/[FEATURE CONTROLLER].js
- server/src/services/[FEATURE SERVICE].js, if present
- server/src/validations/[FEATURE VALIDATION].js, if present
- New matching files under server/src/features/[FEATURE]/
- server/src/routes/index.js only if required to update the route import

REQUIREMENTS:
- Do not modify logic, exports, endpoints, middleware order, models, database behavior, or response shapes.
- Update import paths only.
- Move one feature per task.
```

## Prompt 13 — Reports Section Cleanup

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Remove duplication between the current reports page files only after determining which file is the active route entry. Keep the active behavior unchanged.

ALLOWED FILES:
- src/pages/Reports.tsx
- src/pages/Reports/index.tsx
- src/pages/Reports/ReportGenerator.tsx
- src/App.tsx

REQUIREMENTS:
- First identify which reports files are imported and used.
- Do not delete any file until proving it is unused.
- Preserve route path, page output, report generation, exports, permissions, and API calls.
- Do not touch report API or backend report files.
```

## Prompt 14 — Temporary Script Review Only

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Review the listed root scripts and test files and report whether each is currently referenced. Do not delete or edit anything.

ALLOWED FILES:
- Read-only review of:
  - patch_all_statuses.py
  - patch_store.py
  - patch_store_status.py
  - scratch.ts
  - test-advance.ts
  - test-interconnect.ts
  - test2.ts

REQUIREMENTS:
- Search for references.
- Report purpose, apparent status, and deletion risk.
- Make no changes.
```

## Prompt 15 — Final Structure Verification

```text
[PASTE THE MANDATORY SAFETY HEADER]

TASK:
Verify the completed structural refactor without changing any files.

ALLOWED FILES:
- Read-only access to the complete project

CHECKS:
- Git changed-file list
- Broken imports
- TypeScript build
- ESLint
- Backend tests
- Duplicate files
- Route consistency
- API contract consistency
- Unintended package or lock-file changes

REQUIREMENTS:
- Do not auto-fix.
- Do not install, update, or remove dependencies.
- Report failures with exact file paths and commands.
```
