(() => {
  const HOUSE_ICON_SPECS = {
    'house-small': { width: 56, height: 44, kind: 'small' },
    'house-square': { width: 64, height: 64, kind: 'square' },
    'house-cottage': { width: 80, height: 56, kind: 'cottage' },
    'house-long': { width: 112, height: 48, kind: 'long' },
    'house-manor': { width: 104, height: 72, kind: 'manor' },
  };

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

  function drawRoof(context, x, y, width, height, options = {}) {
    context.save();
    context.shadowColor = 'rgba(48, 29, 14, .28)';
    context.shadowBlur = 3;
    context.shadowOffsetX = 1.5;
    context.shadowOffsetY = 2;
    roundedRectangle(context, x, y, width, height, Math.max(2, Math.min(width, height) * .08));
    context.fillStyle = options.fill ?? '#bd8242';
    context.fill();
    context.shadowColor = 'transparent';
    context.lineWidth = Math.max(1.4, Math.min(width, height) * .045);
    context.strokeStyle = '#5a361e';
    context.stroke();

    context.beginPath();
    context.moveTo(x + width * .08, y + height * .5);
    context.lineTo(x + width * .92, y + height * .5);
    context.strokeStyle = '#6b4122';
    context.lineWidth = Math.max(1, Math.min(width, height) * .035);
    context.stroke();

    context.beginPath();
    context.moveTo(x + width * .12, y + height * .18);
    context.lineTo(x + width * .88, y + height * .18);
    context.strokeStyle = 'rgba(243, 199, 118, .62)';
    context.lineWidth = Math.max(1, Math.min(width, height) * .025);
    context.stroke();

    if (options.crossRidge) {
      context.beginPath();
      context.moveTo(x + width * .5, y + height * .1);
      context.lineTo(x + width * .5, y + height * .9);
      context.strokeStyle = '#6b4122';
      context.lineWidth = Math.max(1, Math.min(width, height) * .035);
      context.stroke();
    }
    context.restore();
  }

  function createHouseImage(spec) {
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, spec.width, spec.height);

    if (spec.kind === 'manor') {
      drawRoof(context, 4, 23, 28, 36, { fill: '#a96838' });
      drawRoof(context, 72, 23, 28, 36, { fill: '#a96838' });
      drawRoof(context, 20, 7, 64, 58, { fill: '#c58a48', crossRidge: true });
    } else if (spec.kind === 'square') {
      drawRoof(context, 6, 6, 52, 52, { fill: '#c18a49', crossRidge: true });
    } else if (spec.kind === 'long') {
      drawRoof(context, 5, 6, 102, 36, { fill: '#ad7339' });
      context.fillStyle = '#e0b367';
      for (let x = 22; x < 94; x += 24) context.fillRect(x, 10, 3, 7);
    } else if (spec.kind === 'small') {
      drawRoof(context, 5, 5, 46, 34, { fill: '#c39152' });
    } else {
      drawRoof(context, 5, 6, 70, 44, { fill: '#bf8443' });
      context.fillStyle = '#724325';
      context.fillRect(58, 4, 7, 10);
    }

    return context.getImageData(0, 0, spec.width, spec.height);
  }

  function registerHouseIcons() {
    for (const [name, spec] of Object.entries(HOUSE_ICON_SPECS)) {
      if (!map.hasImage(name)) map.addImage(name, createHouseImage(spec));
    }
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

  map.on('load', () => {
    registerHouseIcons();
    if (map.getLayer('buildings')) map.setPaintProperty('buildings', 'fill-opacity', 0.62);

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
          14, ['*', ['coalesce', ['get', 'icon_scale_z16'], 0.1], 0.25],
          16, ['coalesce', ['get', 'icon_scale_z16'], 0.1],
          18, ['*', ['coalesce', ['get', 'icon_scale_z16'], 0.1], 4],
          20, ['*', ['coalesce', ['get', 'icon_scale_z16'], 0.1], 16],
        ],
        'icon-rotate': ['coalesce', ['get', 'icon_rotate'], 0],
        'icon-rotation-alignment': 'map',
        'icon-pitch-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: { 'icon-opacity': 0.98 },
    }, map.getLayer('fantasy-icons') ? 'fantasy-icons' : undefined);

    installFootprintToggle();
    applyFootprintVisibility();

    const description = document.querySelector('.legend > div');
    if (description) {
      description.textContent = 'Тип, поворот и масштаб домов рассчитываются по реальному контуру OSM.';
    }
  });
})();
