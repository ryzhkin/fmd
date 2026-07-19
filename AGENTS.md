# Fantasy Map MVP: agent guide

## Start here

Read `ARCHITECTURE.md`, then inspect only the feature being changed. Keep `main.ts`
as a composition root; domain logic belongs in small, testable modules.

Canonical checks:

```sh
npm ci
npm run typecheck
npm run build
npm run test:e2e
npm run check
```

Use `npm run dev` for local development. Refresh the committed Sumy dataset only
when explicitly required:

```sh
npm run data:refresh -- --region=sumy
```

## Non-negotiable invariants

- Roof scale is exactly `2 ** (zoom - 16)`. Do not add LOD or interpolate to a
  different scale: roofs must continue matching OSM footprints at every zoom.
- Runtime and CI read a committed, deterministic region snapshot. They never call
  Overpass. Network access is allowed only in the explicit refresh command.
- Region and feature IDs are stable across deterministic refreshes. Never derive
  them from array position, timestamps, or randomness.
- The original footprint toggle, fantasy/reality modes, shadows, trees and current
  Sumy visual result remain behaviorally compatible unless the task says otherwise.
- A dataset is fetched once, validated at the boundary and shared by installers.
- Layer order is centralized. A feature must not silently reorder another feature's
  MapLibre layers.

## Dependency rules

- Features expose their public surface through their own `index.ts`. Do not import
  another feature's internal files.
- Pass MapLibre, data, assets and configuration explicitly. Do not introduce mutable
  globals or attach application state to `window`.
- Prefer pure functions for geometry, classification and sizing. Use a stateful
  object only when lifecycle or cleanup requires one.
- A stateful feature installer that adds listeners must return cleanup.
- UI controllers change typed view state; renderers do not query arbitrary DOM.
- Extract shared code only after two real consumers exist. Follow DRY, KISS and
  YAGNI; avoid generic frameworks and one-file-per-function fragmentation.
- Aim for focused modules of roughly 80–250 lines, but split by responsibility,
  not by a line-count rule.

## Change workflow

- Put unit tests beside pure modules; keep browser journeys in `tests/`.
- For visual changes, verify mobile views at zoom `15.2`, `18.3` and `19`, with
  fantasy, reality and footprints-off states as applicable.
- Assert no console errors, failed asset requests, duplicate sources or layers.
- Do not load large GeoJSON snapshots into task context unless editing or diagnosing
  the dataset. Inspect schemas or narrow samples instead.
- A new roof type belongs in the building classifier/renderer and typed asset definitions;
  a new map layer belongs in a feature installer; a new region belongs in region
  configuration plus a validated snapshot.

## Deferred product seams

Arbitrary user locations and fog of war are future consumers of existing seams,
not MVP features. Add no backend, accounts, persistence, GPS tracking, offline/PWA
or fog overlay unless a later task explicitly requests them. Preserve stable IDs
and the dataset-provider boundary so those features can be added without rewriting
renderers.
