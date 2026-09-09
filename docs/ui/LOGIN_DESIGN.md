# RailFlow login preview

Updated locally on 10 September 2026. Not committed, pushed or deployed as part of this design request.

## Current design

- RailFlow replaces YardPilot in the visible brand, navigation labels, browser title, help text and report exports.
- The original burgundy / white / light-grey palette is retained, with a compact rail-and-direction brand mark.
- Both railway photos and their captions are removed. The image-free layout uses a concise site introduction and three descriptions of inspections/repairs, team handoffs and maintenance records.
- Sites layout guidance informed the split desktop composition and form-first mobile layout.
- Login, access requests, administrator approval and the 12-character registration password rule are preserved. No account, role or operational workflow was changed.
- Internal storage keys are deliberately unchanged so saved report preferences remain available.
- The two removed web-image files are recoverable from the original generated-image archive outside the project. No raster illustrations are shipped on the login page.

## Previews

- [Desktop preview](login-desktop.png)
- [Mobile preview](login-mobile.png)
- Local route: `/auth`

## Checks

The browser tests cover 360, 390, 768, 1024 and 1440 px, absence of images, the RailFlow title, working tabs, sign-in success/failure, access requests, approval messaging, password visibility and keyboard entry. Authentication and account creation are mocked for browser checks; no real account is created.

The production build, 27 frontend tests, 22 backend tests and all 40 browser tests pass locally. The GitHub runner compatibility correction is recorded in `UPGRADE_STATUS.md`; a new remote run still requires committing and pushing the changes.
