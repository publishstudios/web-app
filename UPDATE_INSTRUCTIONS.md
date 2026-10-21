# Publish Studio — Update & Maintenance Guide

## Revision status
This is a **partially implemented, syntax-checked revision**, not a production-verified release. The project build could not be run because this environment could not reach the npm registry (`EAI_AGAIN registry.npmjs.org`). Do not deploy until dependencies install and `npm run build` succeeds, followed by the manual checks below.

## Project map
- `app/page.jsx` — main UI, A/B/C workflow selection, chapter editing, Word export, image-to-PDF planner workflow, page-break settings, and bookshelf dialog.
- `app/globals.css` — shared colors, layout helpers, and styling.
- `app/layout.jsx` — Next.js root layout and metadata.
- `app/CoverVisualizer.jsx` — cover visualization component.
- `app/HelpCenter.jsx` — help content.
- `app/manuscriptInspector.js` — manuscript checks and warning messages.
- `app/plannerEngine.js` — planner-related calculations.
- `app/productionMath.js` — print/production calculations.
- `app/projectStorage.js` — browser IndexedDB storage for saved projects/reviews.

## Current revision changes
- Removed the misleading `100% Ready` status and changed it to `Review required`.
- Added chapter Draft/Final status controls. Guided/manual Word export is blocked until every chapter is marked Final.
- Added an intentional blank-page-before-chapter toggle. Word export represents this using page breaks; always inspect pagination in Word/LibreOffice after export.
- Word export generates an editable `.docx` from the current title, subtitle, author, copyright, dedication, and structured chapter paragraphs.
- Successful Word export attempts to save a snapshot to browser IndexedDB so it can appear on the bookshelf. Storage failure does not block the file download.
- Bookshelf lists saved project records and offers a confirmation before removing a saved record. Removing a record does not delete a file already downloaded to the device.
- Added a separate planner path that accepts PNG/JPEG interior page images and creates a trim-size PDF. It flags potentially low-resolution pages and contains images proportionally rather than stretching or cropping them.
- Removed the false rejection-free/guaranteed-acceptance claim from the current page copy.

## Important limitations — do not represent these as complete
- The app still does **not** parse/import an uploaded `.docx` manuscript into the editor. The “existing manuscript” pathway is labelled to disclose this limitation.
- The editor is not yet a full Word-like rich-text editor. It does not yet provide the full requested toolbar, find/replace, undo/redo, automatic page-layout preview, or a persistent page model across all edits.
- Blank-page intent is attached to a chapter in current editor state; it is not yet a general-purpose movable page object and is not saved as a full project unless a successful Word export saves a snapshot.
- The planner workflow currently exports a sequence of uploaded images to a trim-size PDF; it does not yet provide a full visual page preview, reorder controls, bleed/margin guides, or KDP-specific validation/acceptance guarantees.
- This is not an authenticated multi-user service. Do not expose admin analytics or claim server-backed accounts/security without a separate backend and real authentication.
- AI integration is not confirmed as a working backend feature.
- A syntax transpilation check passed, but the full Next.js build and browser interaction tests have **not** been completed because npm package installation failed due to a network/DNS error.

## Safe update process
1. Create a Git branch before editing (for example, `feature/publishing-workflow-updates`).
2. Update one feature section at a time. In `app/page.jsx`, search for `SECTION: HOME WORKFLOW SELECTOR`, `EXPORT: build a real editable Word document`, or `PLANNER EXPORT`.
3. Keep workflow copy aligned with what the code actually does. Never promise acceptance by Amazon KDP or another publishing platform.
4. Run `npm install`, then `npm run build` in an environment with npm registry access.
5. Run `npm run dev` and open `http://localhost:3000`.
6. Check the three homepage pathways and confirm the planner path is distinct from Word export.
7. In the guided path, try exporting with chapters in Draft state; confirm it blocks and names chapters. Mark all chapters Final and retry.
8. Export a Word file; open it in Word or LibreOffice and verify front matter, chapter order, and intentional blank page. Recheck pagination manually.
9. In planner mode, upload PNG and JPEG pages in order, confirm resolution warnings, export PDF, and verify trim size and image proportions in a PDF viewer.
10. Check saved bookshelf records, confirmation before deletion, mobile layout, browser console, and error states.
11. Only deploy after build and hands-on checks pass.

## Deployment
The ZIP does not push to GitHub or update Vercel. Deploying is a separate action after review and successful testing.
