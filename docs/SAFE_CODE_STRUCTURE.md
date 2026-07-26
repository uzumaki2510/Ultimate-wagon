# Ultimate Wagon Whisper — Safe Section-Wise Code Structure

## Purpose

This guide provides a clean, section-wise structure for future development without changing the application's current behavior.

No existing source, configuration, environment, package, build, database, or generated file was changed while creating this guide.

## Current Main Sections

### 1. Frontend Application Entry

- `src/main.tsx` — React application bootstrap.
- `src/App.tsx` — main routes and application-level composition.
- `src/App.css` — application-level styles.
- `src/index.css` — global styles and Tailwind directives.
- `src/config.ts` — frontend configuration.

### 2. Frontend Pages

- `src/pages/` — top-level screens.
- `src/pages/SuperAdmin/` — super-admin screens.
- `src/pages/Reports/` — report-specific screens.

Recommended future organization:

```text
src/pages/
  auth/
  dashboard/
  wagons/
  rakes/
  sick-line/
  memos/
  reports/
  administration/
  super-admin/
  profile/
  system/
```

Move files only in a dedicated refactoring step. Update imports in the same step and do not alter behavior.

### 3. Frontend Feature Components

Current application components are in `src/components/`.

Recommended future organization:

```text
src/components/
  layout/
  navigation/
  wagons/
  workflows/
  memos/
  reports/
  shared/
  ui/
```

Suggested mapping:

- Layout: `AppLayout.tsx`, `AppSidebar.tsx`, `NavLink.tsx`.
- Wagons: `WagonInput.tsx`, `WagonTable.tsx`, `WagonDetailsDisplay.tsx`, `EditWagonModal.tsx`, `RepairTypeSelector.tsx`.
- Workflows: `BTPNWorkflow.tsx`, `BTPGLNWorkflow.tsx`.
- Shared: existing reusable loading, error, empty-state, header, search, filter, and data-view components.
- UI: generated/base UI primitives. Avoid changing these unless a task explicitly requires it.

### 4. Frontend API Layer

Current API modules are already separated in `src/api/`:

```text
src/api/
  client.ts
  auth.ts
  admin.ts
  users.ts
  wagons.ts
  rakes.ts
  memos.ts
  reports.ts
  workflows.ts
```

Keep all HTTP requests inside this section. Pages and components should call API modules rather than using Axios or `fetch` directly.

### 5. Frontend State and Context

- `src/store/useAppStore.ts` — global Zustand state.
- `src/contexts/AuthContext.tsx` — authentication context.

Recommended future structure:

```text
src/store/
  app/
  wagons/
  rakes/
  workflows/
  ui/

src/contexts/
  auth/
```

Do not split the store until behavior is covered by tests or verified feature-by-feature.

### 6. Frontend Domain Logic

Current reusable logic is in `src/lib/` and shared types are in `src/types/`.

Recommended future organization:

```text
src/lib/
  export/
  pdf/
  wagons/
  workflows/
  shared/

src/types/
  auth.ts
  wagon.ts
  rake.ts
  workflow.ts
  memo.ts
  report.ts
  user.ts
  index.ts
```

Keep business rules outside visual components wherever practical.

### 7. Backend Entry and Configuration

- `server/src/server.js` — starts the server.
- `server/src/app.js` — Express application setup.
- `server/src/config/` — database, environment, and logger configuration.

These files should remain small and only handle application wiring.

### 8. Backend Routes

- `server/src/routes/` — endpoint declarations.

Each route file should only:

1. Declare the URL and HTTP method.
2. Apply middleware.
3. Call the correct controller.

Do not place database or business logic directly in routes.

### 9. Backend Controllers

- `server/src/controllers/` — request/response handling.

Controllers should:

1. Read validated request data.
2. Call a service.
3. Return the response.

Large controller logic should gradually move into feature services, one controller at a time.

### 10. Backend Services

- `server/src/services/` — business logic and reusable operations.

Recommended future service grouping:

```text
server/src/services/
  auth/
  users/
  wagons/
  rakes/
  workflows/
  memos/
  reports/
  notifications/
  exports/
```

Do not move logic between controllers and services in the same task as a functional feature change.

### 11. Backend Models

- `server/src/models/` — MongoDB/Mongoose models.

Keep one model per file. Model hooks and schema-level validation should remain with the corresponding model.

### 12. Backend Validation and Middleware

- `server/src/validations/` — request schemas.
- `server/src/middleware/` — authentication, authorization, validation, errors, pagination, security, and rate limits.

These are shared infrastructure sections. Change them only through dedicated tasks because changes may affect many endpoints.

### 13. Backend Utilities

- `server/src/utils/` — response wrappers, errors, async handling, audit logging, and constants.

Avoid adding feature-specific business logic to `utils`.

## Safe Refactoring Order

Use this sequence so each change stays small and reviewable:

1. Document and verify the current build and primary workflows.
2. Organize frontend layout/navigation components.
3. Organize one frontend feature at a time.
4. Split only the largest component after its feature folder is stable.
5. Organize frontend types and domain helpers.
6. Refactor one backend controller into a matching service at a time.
7. Organize backend services only after imports and tests are stable.
8. Clean temporary scripts and generated files only in a separate cleanup task.

## Strict Change Rules

For every coding task:

- Change only the files explicitly listed in the prompt.
- Do not run broad formatters across the repository.
- Do not rename unrelated variables, functions, files, routes, API responses, database fields, CSS classes, or UI text.
- Do not upgrade dependencies.
- Do not edit `.env`, `.env.example`, lock files, build output, logs, or `node_modules` unless explicitly requested.
- Do not change API contracts while reorganizing code.
- Do not combine refactoring with new functionality.
- Stop and report before touching an unlisted file.
- Show the exact changed-file list after completing a task.

## Validation After Every Section

Run only the checks relevant to the changed section:

```bash
npm run build
npm run lint
```

For backend-only work:

```bash
cd server
npm test
```

The included `node_modules` originated from another operating system. In a new environment, dependency installation may need to be refreshed before build validation. This is an environment issue and should not be fixed as part of a structure-only task.
