# YardPilot UI redesign

Implemented the approved YardPilot / Wagon Maintenance identity using the original burgundy, white and light-grey palette, not teal. The React Router upgrade remains deferred.

## Changes

- Six desktop sections: Home, Wagons, Workshop, Memos, Reports and permission-controlled Administration.
- Five-item mobile bottom navigation with contextual section selectors and a role-aware More menu.
- Responsive wagon cards and stacked tables, larger touch targets, labelled forms and accessible search controls.
- Simplified dashboard, workshop overview, guided memo entry, help and appearance preferences.
- Functional report CSV export, full-record global search and corrected workshop-stage grouping.

## Verification

- Production build passed.
- 11 frontend unit tests, 14 backend regression tests and 14 Chromium browser tests passed.
- Browser coverage includes 26 destinations at 360, 390, 768 and 1440 pixels, plus navigation, search, forms, exports and security flows.
- Browser previews use mocked sample data. This is not physical-device or Safari verification, nor an exhaustive accessibility audit.
- Existing lint debt and build chunk-size warnings remain; no React Router upgrade, deployment or commit was performed.

## Implemented previews

- Desktop: `docs/ui/yardpilot-desktop.png`
- Mobile: `docs/ui/yardpilot-mobile.png`
