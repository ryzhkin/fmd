(() => {
  const REFERENCE_ZOOM = 16;
  const CENTER_LATITUDE = 50.8650625;
  const METERS_PER_PIXEL_Z16 =
    (78271.51696402048 * Math.cos((CENTER_LATITUDE * Math.PI) / 180)) / 2 ** REFERENCE_ZOOM;
  const PROCEDURAL_PIXEL_RATIO = 4;
  const DETAILED_ROOF_MAX_PIXEL_RATIO = 16;
  const RGBA_BYTES_PER_PIXEL = 4;
  const MAX_ICON_EDGE = 1024;
  const MAX_RENDER_ZOOM = 19;
  const SHADOW_MAX_PIXEL_RATIO = 4;
  const SHADOW_ATLAS_BUDGET_BYTES = 12 * 1024 * 1024;
  const SHADOW_MAX_EDGE = 512;
  const SHADOW_CANVAS_SCALE = 1.5;
  const SHADOW_BLUR = 0.85;
  const SHADOW_COLOR = '#351f0f';
  const FOOTPRINT_FILL = 0.94;
  const TREE_CANOPY_METERS = 6;
  const TREE_LOGICAL_SIZE = TREE_CANOPY_METERS / METERS_PER_PIXEL_Z16;
  const TREE_IMAGE_NAME = 'decorative-tree-deciduous';
  const TREE_SHADOW_IMAGE_NAME = 'decorative-tree-deciduous-shadow';
  const TREE_ASSET = Object.freeze({
    url: './assets/tree-deciduous-topdown.webp',
    label: 'Лиственные деревья',
  });
  const ICON_SCALE_PROFILES = Object.freeze({
    detail: Object.freeze({
      base: 2,
      stops: Object.freeze([[14, 0.25], [16, 1], [18, 4], [20, 16]]),
    }),
    overview: Object.freeze({
      base: 2,
      stops: Object.freeze([[14, 0.18], [16, 0.7], [17, 1.35], [18, 2.5], [18.85, 7.2]]),
    }),
  });
  const OVERVIEW_MAX_ZOOM = 18.85;
  const DETAIL_MIN_ZOOM = 18.4;
  const DETAILED_ROOFS = Object.freeze({
    square: Object.freeze({
      url: './assets/house-square-topdown.webp',
      label: 'квадратных',
      atlasBudgetBytes: 32 * 1024 * 1024,
    }),
    cottage: Object.freeze({
      url: './assets/house-cottage-topdown.webp',
      label: 'прямоугольных',
      atlasBudgetBytes: 24 * 1024 * 1024,
    }),
    long: Object.freeze({
      url: './assets/house-long-topdown.webp',
      label: 'сильно вытянутых',
      atlasBudgetBytes: 8 * 1024 * 1024,
    }),
  });

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      image.src = url;
    });
  }

  async function loadOptionalImage(url, errorMessage) {
    try {
      return await loadImage(url);
    } catch (error) {
      console.warn(`${errorMessage}:`, error);
      return null;
    }
  }

  async function loadDetailedRoofImages() {
    const entries = await Promise.all(Object.entries(DETAILED_ROOFS).map(async ([style, roof]) => {
      const image = await loadOptionalImage(
        roof.url,
        `Detailed ${style} roof is unavailable; using procedural fallback`
      );
      return [style, image];
    }));
    return Object.fromEntries(entries.filter(([, image]) => Boolean(image)));
  }

  function roundedRectangle(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
  }

  function roofStyle(properties) {
    if (properties.roof_style) return properties.roof_style;
    const legacyStyle = String(properties.building_icon ?? '').replace('house-', '');
    if (['small', 'square', 'cottage', 'long', 'manor', 'compound'].includes(legacyStyle)) {
      return legacyStyle;
    }

    const area = Number(properties.building_area_m2) || 0;
    const aspect = Number(properties.building_aspect) || 1;
    const rectangularity = Number(properties.building_rectangularity) || 1;
    if (rectangularity < 0.72) return 'compound';
    if (area >= 240) return 'manor';
    if (aspect >= 2.05) return 'long';
    if (area <= 55) return 'small';
    if (aspect <= 1.25) return 'square';
    return 'cottage';
  }

  function logicalDimensions(properties) {
    const majorMeters = Math.max(1, Number(properties.building_major_m) || 8);
    const minorMeters = Math.max(1, Number(properties.building_minor_m) || 6);
    const width = Number(properties.icon_width_z16) ||
      (majorMeters / METERS_PER_PIXEL_Z16) * FOOTPRINT_FILL;
    const height = Number(properties.icon_height_z16) ||
      (minorMeters / METERS_PER_PIXEL_Z16) * FOOTPRINT_FILL;

    return {
      width: clamp(width, 4, 180),
      height: clamp(height, 3, 140),
    };
  }

  function drawRoofSurface(context, x, y, width, height, options = {}) {
    const shortestSide = Math.min(width, height);
    const radius = clamp(shortestSide * 0.08, 0.35, 2.4);
    const outlineWidth = clamp(shortestSide * 0.07, 0.45, 1.8);

    context.save();
    roundedRectangle(context, x, y, width, height, radius);
    context.fillStyle = options.fill ?? '#bd8242';
    context.fill();

    context.lineWidth = outlineWidth;
    context.strokeStyle = '#5a361e';
    context.stroke();

    if (options.ridge !== false) {
      context.beginPath();
      context.moveTo(x + width * 0.06, y + height * 0.5);
      context.lineTo(x + width * 0.94, y + height * 0.5);
      context.strokeStyle = '#6b4122';
      context.lineWidth = clamp(shortestSide * 0.045, 0.35, 1.2);
      context.stroke();
    }

    context.beginPath();
    context.moveTo(x + width * 0.08, y + height * 0.15);
    context.lineTo(x + width * 0.92, y + height * 0.15);
    context.strokeStyle = 'rgba(246, 202, 123, .68)';
    context.lineWidth = clamp(shortestSide * 0.025, 0.25, 0.7);
    context.stroke();

    if (options.crossRidge) {
      context.beginPath();
      context.moveTo(x + width * 0.5, y + height * 0.08);
      context.lineTo(x + width * 0.5, y + height * 0.92);
      context.strokeStyle = '#6b4122';
      context.lineWidth = clamp(shortestSide * 0.045, 0.35, 1.2);
      context.stroke();
    }

    context.restore();
  }

  function drawProceduralHouse(context, width, height, style) {
    const inset = clamp(Math.min(width, height) * 0.035, 0.25, 1.1);
    const x = inset;
    const y = inset;
    const usableWidth = Math.max(1, width - inset * 2);
    const usableHeight = Math.max(1, height - inset * 2);

    if (style === 'compound' && usableWidth > 7 && usableHeight > 5) {
      drawRoofSurface(context, x, y, usableWidth, usableHeight * 0.61, {
        fill: '#b8793e',
      });
      drawRoofSurface(context, x, y + usableHeight * 0.37, usableWidth * 0.5, usableHeight * 0.63, {
        fill: '#c18748',
        crossRidge: true,
      });
      return;
    }

    const fillByStyle = {
      small: '#c39152',
      square: '#c18a49',
      cottage: '#bf8443',
      long: '#ad7339',
      manor: '#a96838',
    };

    drawRoofSurface(context, x, y, usableWidth, usableHeight, {
      fill: fillByStyle[style] ?? '#bd8242',
      crossRidge: style === 'square' || style === 'manor',
    });

    if (style === 'long' && usableWidth > 14) {
      context.save();
      context.fillStyle = '#e0b367';
      const markWidth = clamp(usableHeight * 0.08, 0.35, 1.2);
      const markHeight = clamp(usableHeight * 0.18, 0.7, 2.2);
      for (let markX = x + usableWidth * 0.2; markX < x + usableWidth * 0.86; markX += usableWidth * 0.22) {
        context.fillRect(markX, y + usableHeight * 0.18, markWidth, markHeight);
      }
      context.restore();
    }

    if (style === 'cottage' && usableWidth > 9 && usableHeight > 5) {
      context.save();
      context.fillStyle = '#724325';
      const chimneyWidth = clamp(usableHeight * 0.12, 0.5, 1.5);
      const chimneyHeight = clamp(usableHeight * 0.24, 0.9, 2.8);
      context.fillRect(
        x + usableWidth * 0.76,
        y + usableHeight * 0.04,
        chimneyWidth,
        chimneyHeight
      );
      context.restore();
    }

    if (style === 'manor' && usableWidth > 12 && usableHeight > 7) {
      context.save();
      context.fillStyle = 'rgba(238, 181, 91, .82)';
      const dormerWidth = clamp(usableWidth * 0.08, 0.8, 3);
      const dormerHeight = clamp(usableHeight * 0.13, 0.8, 2.6);
      context.fillRect(x + usableWidth * 0.22, y + usableHeight * 0.22, dormerWidth, dormerHeight);
      context.fillRect(x + usableWidth * 0.7, y + usableHeight * 0.22, dormerWidth, dormerHeight);
      context.restore();
    }
  }

  function boundedPixelRatio(logicalArea, desiredRatio, maximumRatio, budgetBytes) {
    const budgetRatio = logicalArea > 0
      ? Math.sqrt(budgetBytes / (logicalArea * RGBA_BYTES_PER_PIXEL))
      : maximumRatio;
    return Math.max(1, Math.min(maximumRatio, desiredRatio, budgetRatio));
  }

  function buildingImageRatios(geojson, detailedRoofImages) {
    const zoomScale = 2 ** (MAX_RENDER_ZOOM - REFERENCE_ZOOM);
    const displayRatio = Math.max(1, window.devicePixelRatio || 1);
    const detailedRoofAreas = Object.fromEntries(
      Object.keys(detailedRoofImages).map(style => [style, 0])
    );
    let shadowArea = 0;

    for (const feature of geojson.features ?? []) {
      const properties = feature.properties ?? {};
      if (properties.kind !== 'building_icon') continue;
      const dimensions = logicalDimensions(properties);
      const area = dimensions.width * dimensions.height;
      const style = roofStyle(properties);
      if (style in detailedRoofAreas) detailedRoofAreas[style] += area;
      shadowArea += area * SHADOW_CANVAS_SCALE ** 2;
    }

    return {
      detailedRoofs: Object.fromEntries(Object.entries(detailedRoofAreas).map(([style, area]) => [
        style,
        boundedPixelRatio(
          area,
          displayRatio * zoomScale,
          DETAILED_ROOF_MAX_PIXEL_RATIO,
          DETAILED_ROOFS[style].atlasBudgetBytes
        ),
      ])),
      shadow: boundedPixelRatio(
        shadowArea,
        displayRatio * 2,
        SHADOW_MAX_PIXEL_RATIO,
        SHADOW_ATLAS_BUDGET_BYTES
      ),
    };
  }

  function drawTopDownAsset(context, image, width, height) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);
  }

  function createCanvasImage(width, height, pixelRatio, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width * pixelRatio));
    canvas.height = Math.max(1, Math.ceil(height * pixelRatio));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable');
    context.scale(pixelRatio, pixelRatio);
    context.clearRect(0, 0, width, height);
    draw(context, width, height);

    return {
      canvas,
      data: context.getImageData(0, 0, canvas.width, canvas.height),
      pixelRatio,
      logicalWidth: width,
      logicalHeight: height,
    };
  }

  function createHouseImage(properties, detailedRoofImages, detailedRoofRatios) {
    const style = roofStyle(properties);
    const detailedRoofImage = detailedRoofImages[style] ?? null;
    const dimensions = logicalDimensions(properties);
    const pixelRatio = detailedRoofImage
      ? Math.max(
        1,
        Math.min(
          detailedRoofRatios[style],
          MAX_ICON_EDGE / Math.max(dimensions.width, dimensions.height)
        )
      )
      : PROCEDURAL_PIXEL_RATIO;

    return createCanvasImage(dimensions.width, dimensions.height, pixelRatio, (context, width, height) => {
      if (detailedRoofImage) {
        drawTopDownAsset(context, detailedRoofImage, width, height);
      } else {
        drawProceduralHouse(context, width, height, style);
      }
    });
  }

  function createShadowImage(houseImage, requestedPixelRatio) {
    const width = houseImage.logicalWidth * SHADOW_CANVAS_SCALE;
    const height = houseImage.logicalHeight * SHADOW_CANVAS_SCALE;
    const pixelRatio = Math.max(
      1,
      Math.min(requestedPixelRatio, SHADOW_MAX_EDGE / Math.max(width, height))
    );
    const mask = document.createElement('canvas');
    mask.width = houseImage.canvas.width;
    mask.height = houseImage.canvas.height;
    const maskContext = mask.getContext('2d');
    if (!maskContext) throw new Error('Canvas 2D context is unavailable');
    maskContext.drawImage(houseImage.canvas, 0, 0);
    maskContext.globalCompositeOperation = 'source-in';
    maskContext.fillStyle = SHADOW_COLOR;
    maskContext.fillRect(0, 0, mask.width, mask.height);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width * pixelRatio));
    canvas.height = Math.max(1, Math.ceil(height * pixelRatio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable');
    const drawWidth = houseImage.logicalWidth * pixelRatio;
    const drawHeight = houseImage.logicalHeight * pixelRatio;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;
    context.shadowColor = SHADOW_COLOR;
    context.shadowBlur = SHADOW_BLUR * pixelRatio;
    context.drawImage(mask, x, y, drawWidth, drawHeight);

    return {
      data: context.getImageData(0, 0, canvas.width, canvas.height),
      pixelRatio,
    };
  }

  function prepareBuildingIcons(geojson, detailedRoofImages) {
    const imageRatios = buildingImageRatios(geojson, detailedRoofImages);
    for (const feature of geojson.features ?? []) {
      const properties = feature.properties ?? {};
      if (properties.kind !== 'building_icon') continue;

      const sourceId = properties.source_osm_id ?? properties.osm_id ?? feature.id;
      const safeId = String(sourceId).replace(/[^a-zA-Z0-9_-]/g, '-');
      const houseImageName = `procedural-house-${safeId}`;
      const shadowImageName = `procedural-house-shadow-${safeId}`;
      properties.building_icon = houseImageName;
      properties.building_shadow_icon = shadowImageName;

      if (!map.hasImage(houseImageName) || !map.hasImage(shadowImageName)) {
        const houseImage = createHouseImage(
          properties,
          detailedRoofImages,
          imageRatios.detailedRoofs
        );
        if (!map.hasImage(houseImageName)) {
          map.addImage(houseImageName, houseImage.data, { pixelRatio: houseImage.pixelRatio });
        }
        if (!map.hasImage(shadowImageName)) {
          const shadowImage = createShadowImage(houseImage, imageRatios.shadow);
          map.addImage(shadowImageName, shadowImage.data, { pixelRatio: shadowImage.pixelRatio });
        }
      }
    }
    return geojson;
  }

  function prepareTreeImages(image) {
    if (!image) return false;

    const pixelRatio = MAX_ICON_EDGE / TREE_LOGICAL_SIZE;
    const treeImage = createCanvasImage(
      TREE_LOGICAL_SIZE,
      TREE_LOGICAL_SIZE,
      pixelRatio,
      (context, width, height) => drawTopDownAsset(context, image, width, height)
    );
    if (!map.hasImage(TREE_IMAGE_NAME)) {
      map.addImage(TREE_IMAGE_NAME, treeImage.data, { pixelRatio: treeImage.pixelRatio });
    }
    if (!map.hasImage(TREE_SHADOW_IMAGE_NAME)) {
      const requestedShadowRatio = SHADOW_MAX_EDGE /
        (TREE_LOGICAL_SIZE * SHADOW_CANVAS_SCALE);
      const shadowImage = createShadowImage(treeImage, requestedShadowRatio);
      map.addImage(TREE_SHADOW_IMAGE_NAME, shadowImage.data, {
        pixelRatio: shadowImage.pixelRatio,
      });
    }
    return true;
  }

  let footprintsVisible = true;
  const footprintLayerIds = ['buildings-shadow', 'buildings'];

  function applyFootprintVisibility() {
    const fantasyMode = document.body.classList.contains('fantasy');
    for (const layerId of footprintLayerIds) {
      if (!map.getLayer(layerId)) continue;
      map.setLayoutProperty(layerId, 'visibility', fantasyMode && footprintsVisible ? 'visible' : 'none');
    }
  }

  function installFootprintToggle() {
    const modes = document.querySelector('.modes');
    if (!modes || modes.querySelector('[data-toggle-footprints]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Контуры';
    button.className = 'active';
    button.setAttribute('aria-pressed', 'true');
    button.dataset.toggleFootprints = '';
    button.addEventListener('click', () => {
      footprintsVisible = !footprintsVisible;
      button.classList.toggle('active', footprintsVisible);
      button.setAttribute('aria-pressed', String(footprintsVisible));
      applyFootprintVisibility();
    });
    modes.append(button);

    document.querySelectorAll('[data-mode]').forEach(modeButton => {
      modeButton.addEventListener('click', () => setTimeout(applyFootprintVisibility, 0));
    });
  }

  function mapScaleExpression(scaleProperty, profile = ICON_SCALE_PROFILES.detail) {
    const scale = scaleProperty ? ['coalesce', ['get', scaleProperty], 1] : null;
    const atZoom = value => scale ? ['*', scale, value] : value;
    return [
      'interpolate', ['exponential', profile.base], ['zoom'],
      ...profile.stops.flatMap(([zoom, value]) => [zoom, atZoom(value)]),
    ];
  }

  function symbolLayout(image, rotationProperty, scaleProperty, scaleProfile) {
    return {
      'icon-image': image,
      'icon-size': mapScaleExpression(scaleProperty, scaleProfile),
      'icon-rotate': ['coalesce', ['get', rotationProperty], 0],
      'icon-rotation-alignment': 'map',
      'icon-pitch-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-padding': 0,
    };
  }

  function buildingSymbolLayout(imageProperty, scaleProfile) {
    return symbolLayout(['get', imageProperty], 'icon_rotate', null, scaleProfile);
  }

  function treeSymbolLayout(imageName) {
    return symbolLayout(imageName, 'tree_rotate', 'tree_scale');
  }

  function shadowPaint(opacity) {
    return {
      'icon-opacity': opacity,
      'icon-translate': [
        'interpolate', ['linear'], ['zoom'],
        14, ['literal', [0.25, 0.5]],
        16, ['literal', [1, 1.5]],
        18, ['literal', [3, 4]],
        19, ['literal', [5, 7]],
      ],
      'icon-translate-anchor': 'viewport',
    };
  }

  function zoomOpacity(stops) {
    return [
      'interpolate', ['linear'], ['zoom'],
      ...stops.flatMap(([zoom, opacity]) => [zoom, opacity]),
    ];
  }

  function addBuildingLayers(options, beforeLayerId) {
    const suffix = options.suffix ? `-${options.suffix}` : '';
    const zoomRange = {
      minzoom: options.minzoom,
      ...(options.maxzoom ? { maxzoom: options.maxzoom } : {}),
    };

    map.addLayer({
      id: `building-icon-shadows${suffix}`,
      type: 'symbol',
      source: 'world',
      filter: options.filter,
      ...zoomRange,
      layout: buildingSymbolLayout('building_shadow_icon', options.scaleProfile),
      paint: shadowPaint(options.shadowOpacity),
    }, beforeLayerId);

    map.addLayer({
      id: `building-icons${suffix}`,
      type: 'symbol',
      source: 'world',
      filter: options.filter,
      ...zoomRange,
      layout: buildingSymbolLayout('building_icon', options.scaleProfile),
      paint: { 'icon-opacity': options.iconOpacity },
    }, beforeLayerId);
  }

  map.on('load', async () => {
    try {
      const [response, detailedRoofImages, treeAssetImage] = await Promise.all([
        fetch('./data/map.geojson', { cache: 'no-store' }),
        loadDetailedRoofImages(),
        loadOptionalImage(TREE_ASSET.url, 'Decorative tree asset is unavailable'),
      ]);
      if (!response.ok) throw new Error(`GeoJSON request failed: ${response.status}`);
      for (const style of Object.keys(DETAILED_ROOFS)) {
        document.body.dataset[`${style}RoofAsset`] = detailedRoofImages[style]
          ? 'loaded'
          : 'fallback';
      }
      const geojson = prepareBuildingIcons(await response.json(), detailedRoofImages);
      const treeAssetReady = prepareTreeImages(treeAssetImage);
      document.body.dataset.treeAsset = treeAssetReady ? 'loaded' : 'unavailable';
      const worldSource = map.getSource('world');
      if (!worldSource || typeof worldSource.setData !== 'function') {
        throw new Error('MapLibre world source is unavailable');
      }
      worldSource.setData(geojson);

      if (map.getLayer('buildings')) map.setPaintProperty('buildings', 'fill-opacity', 0.45);

      const beforeLayerId = map.getLayer('fantasy-icons') ? 'fantasy-icons' : undefined;
      if (treeAssetReady) {
        const treeOpacity = zoomOpacity([[16.5, 0], [17.2, 0.55], [18.1, 0.99]]);
        const treeShadowOpacity = zoomOpacity([[16.5, 0], [17.2, 0.14], [18.1, 0.26]]);
        map.addLayer({
          id: 'tree-decoration-shadows',
          type: 'symbol',
          source: 'world',
          filter: ['==', ['get', 'kind'], 'tree_decoration'],
          minzoom: 16.5,
          layout: treeSymbolLayout(TREE_SHADOW_IMAGE_NAME),
          paint: shadowPaint(treeShadowOpacity),
        }, beforeLayerId);

        map.addLayer({
          id: 'tree-decorations',
          type: 'symbol',
          source: 'world',
          filter: ['==', ['get', 'kind'], 'tree_decoration'],
          minzoom: 16.5,
          layout: treeSymbolLayout(TREE_IMAGE_NAME),
          paint: { 'icon-opacity': treeOpacity },
        }, beforeLayerId);
      }

      const buildingFilter = ['==', ['get', 'kind'], 'building_icon'];
      addBuildingLayers({
        suffix: 'overview',
        minzoom: 14.5,
        maxzoom: OVERVIEW_MAX_ZOOM,
        filter: buildingFilter,
        scaleProfile: ICON_SCALE_PROFILES.overview,
        shadowOpacity: zoomOpacity([[14.5, 0.18], [18.35, 0.24], [18.8, 0]]),
        iconOpacity: zoomOpacity([[14.5, 0.96], [18.35, 0.96], [18.8, 0]]),
      }, beforeLayerId);
      addBuildingLayers({
        minzoom: DETAIL_MIN_ZOOM,
        filter: buildingFilter,
        scaleProfile: ICON_SCALE_PROFILES.detail,
        shadowOpacity: zoomOpacity([[18.4, 0], [18.8, 0.3]]),
        iconOpacity: zoomOpacity([[18.4, 0], [18.8, 0.99]]),
      }, beforeLayerId);

      installFootprintToggle();
      applyFootprintVisibility();

      const description = document.querySelector('.legend > div');
      if (description) {
        const detailedLabels = Object.keys(detailedRoofImages)
          .map(style => DETAILED_ROOFS[style]?.label)
          .filter(Boolean);
        description.textContent = detailedLabels.length
          ? `Форма, положение и поворот домов берутся из OSM; обзорный LOD уменьшает крыши, а детальный возвращает реальный размер. Для ${detailedLabels.join(' и ')} зданий используются детализированные фэнтезийные крыши. ${treeAssetReady ? `${TREE_ASSET.label} добавляются только там, где рядом нет зданий, дорог и воды.` : ''}`
          : 'Каждая крыша процедурно строится по реальным длине, ширине и повороту контура OSM.';
      }
    } catch (error) {
      console.error('Building renderer failed:', error);
      const status = document.getElementById('status');
      if (status) status.innerHTML = `<div class="error">Ошибка построения домов: ${error.message}</div>`;
    }
  });
})();
