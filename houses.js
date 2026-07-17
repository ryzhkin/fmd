(() => {
  const REFERENCE_ZOOM = 16;
  const CENTER_LATITUDE = 50.8650625;
  const METERS_PER_PIXEL_Z16 =
    (156543.03392804097 * Math.cos((CENTER_LATITUDE * Math.PI) / 180)) / 2 ** REFERENCE_ZOOM;
  const PIXEL_RATIO = 4;
  const FOOTPRINT_FILL = 0.94;

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

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
    context.shadowColor = 'rgba(48, 29, 14, .26)';
    context.shadowBlur = clamp(shortestSide * 0.12, 0.5, 2.2);
    context.shadowOffsetX = clamp(shortestSide * 0.045, 0.25, 0.9);
    context.shadowOffsetY = clamp(shortestSide * 0.065, 0.35, 1.2);

    roundedRectangle(context, x, y, width, height, radius);
    context.fillStyle = options.fill ?? '#bd8242';
    context.fill();

    context.shadowColor = 'transparent';
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

  function createHouseImage(properties) {
    const { width, height } = logicalDimensions(properties);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width * PIXEL_RATIO));
    canvas.height = Math.max(1, Math.ceil(height * PIXEL_RATIO));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable');
    context.scale(PIXEL_RATIO, PIXEL_RATIO);
    context.clearRect(0, 0, width, height);
    drawProceduralHouse(context, width, height, roofStyle(properties));

    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  function prepareBuildingIcons(geojson) {
    for (const feature of geojson.features ?? []) {
      const properties = feature.properties ?? {};
      if (properties.kind !== 'building_icon') continue;

      const sourceId = properties.source_osm_id ?? properties.osm_id ?? feature.id;
      const imageName = `procedural-house-${String(sourceId).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      properties.building_icon = imageName;

      if (!map.hasImage(imageName)) {
        map.addImage(imageName, createHouseImage(properties), { pixelRatio: PIXEL_RATIO });
      }
    }
    return geojson;
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

  map.on('load', async () => {
    try {
      const response = await fetch('./data/map.geojson', { cache: 'no-store' });
      if (!response.ok) throw new Error(`GeoJSON request failed: ${response.status}`);
      const geojson = prepareBuildingIcons(await response.json());
      const worldSource = map.getSource('world');
      if (!worldSource || typeof worldSource.setData !== 'function') {
        throw new Error('MapLibre world source is unavailable');
      }
      worldSource.setData(geojson);

      if (map.getLayer('buildings')) map.setPaintProperty('buildings', 'fill-opacity', 0.45);

      map.addLayer({
        id: 'building-icons',
        type: 'symbol',
        source: 'world',
        filter: ['==', ['get', 'kind'], 'building_icon'],
        minzoom: 14.5,
        layout: {
          'icon-image': ['get', 'building_icon'],
          'icon-size': [
            'interpolate', ['exponential', 2], ['zoom'],
            14, 0.25,
            16, 1,
            18, 4,
            20, 16,
          ],
          'icon-rotate': ['coalesce', ['get', 'icon_rotate'], 0],
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-padding': 0,
        },
        paint: { 'icon-opacity': 0.99 },
      }, map.getLayer('fantasy-icons') ? 'fantasy-icons' : undefined);

      installFootprintToggle();
      applyFootprintVisibility();

      const description = document.querySelector('.legend > div');
      if (description) {
        description.textContent = 'Каждая крыша процедурно строится по реальным длине, ширине и повороту контура OSM.';
      }
    } catch (error) {
      console.error('Building renderer failed:', error);
      const status = document.getElementById('status');
      if (status) status.innerHTML = `<div class="error">Ошибка построения домов: ${error.message}</div>`;
    }
  });
})();