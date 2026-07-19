# Fantasy Map MVP architecture

## Purpose

The MVP reproduces the current Sumy test square with a maintainable TypeScript
runtime. MapLibre renders a deterministic, committed GeoJSON snapshot; independent
features install buildings, trees, papyrus and UI behavior. The architecture is
deliberately small so an agent can modify one feature without reading the whole app.

## Runtime flow

```text
RegionDefinition -> DatasetProvider -> validation -> shared GeoJSON source
                                              |
assets ---------------------------------------+-> feature preparation
                                                   |
                   base -> papyrus -> trees -> buildings -> UI
                                                   |
                                                cleanup
```

Startup creates UI and MapLibre, loads the region dataset and assets in parallel,
validates data once, adds one shared source, then installs features in centralized
layer order. Critical dataset failure stops startup and produces an error state;
missing decorative imagery uses the feature's existing fallback. Loading ends only
after all critical installers complete.

## Module boundaries

- **Application/configuration** owns startup, error handling, region selection and
  the ordered installer list. It contains no geometry or drawing algorithms.
- **Map core** owns MapLibre creation, base style, shared source registration and
  layer-order policy. It knows no building or tree classification rules.
- **Data** owns `RegionDefinition`, snapshot loading and runtime validation. Data
  providers return the same typed contract regardless of where data may come from.
- **Buildings** owns footprint measurements, roof classification, exact zoom sizing,
  canvas/atlas rendering, shadows and its MapLibre layers.
- **Trees** owns deterministic placement, obstacle decisions, tree assets, shadows
  and its layers. It consumes validated features, not building internals.
- **Papyrus** owns texture/effect rendering and its layers.
- **UI** owns mode, footprint toggle, legend and loading/error presentation. It
  updates `MapViewState` and delegates map effects through explicit interfaces.
- **Asset helpers** provide one image-loading policy; each visual feature owns its
  typed asset definitions and fallback behavior.

Each feature publishes only an `index.ts`. Tests may import a feature's pure modules
when colocated with them, but production features may not reach across internal
directories.

## Shared contracts

```ts
interface RegionDefinition {
  id: string;
  title: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  maxBounds: [[number, number], [number, number]];
  initialZoom: number;
  datasetUrl: string;
}

interface DatasetProvider {
  load(region: RegionDefinition, signal?: AbortSignal): Promise<MapDataset>;
}

interface MapFeatureContext {
  map: maplibregl.Map;
  dataset: MapDataset;
}

type FeatureInstaller =
  (context: MapFeatureContext) => void | (() => void) | Promise<void | (() => void)>;

interface MapViewState {
  mode: "fantasy" | "reality";
  footprintsVisible: boolean;
}
```

`MapDataset` is a GeoJSON `FeatureCollection` whose feature properties form a
discriminated union by `kind`. Validation occurs when the provider loads it; feature
modules may then rely on the typed contract. Region and feature IDs must remain
stable, and snapshot output must be deterministic apart from metadata written by an
explicit refresh.

## Data lifecycle and extension

- `public/data/regions/sumy.geojson` is the MVP source of truth at runtime.
- `npm run data:refresh -- --region=sumy` is the only path that contacts OSM/Overpass:
  fetch, transform, enrich buildings, place trees, validate, then replace snapshot.
- Production builds copy the snapshot and never regenerate it.
- Add a region by defining its `RegionDefinition`, generating a validated snapshot
  and registering it. Do not fork renderers per region.
- Add a roof or decoration by extending its feature classifier/renderer and asset
  definitions. Do not add conditionals to application startup.
- Add a feature by implementing an installer with cleanup and placing it in the
  centralized order. It must not mutate another feature's source data.

Exact building scale, `2 ** (zoom - 16)`, is part of the rendering contract. Shadows
may be viewport-translated, but roof geometry must not use LOD or a second scale.

## Future seams (not implemented in MVP)

A future location service selects or generates a `RegionDefinition` and supplies a
`DatasetProvider`; existing UI and renderers continue consuming `MapDataset`.

Fog of war will be a separate feature pipeline:

```text
location stream -> revealed-cell calculation -> fog overlay -> persistence adapter
```

It must not rewrite OSM features or building/tree renderers. Persisted reveal state
will key off stable region/cell IDs. Backend sync, accounts, GPS tracking, persistence
and offline behavior remain unspecified until that feature is planned.
