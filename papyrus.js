(() => {
  const IMAGE_ID = 'papyrus-texture';
  const TEXTURE_URL = './assets/papyrus-texture.svg';
  const TILE_SIZE = 512;

  function createSoftenedTexture(image) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas 2D context is unavailable');

    context.fillStyle = '#e8dcc1';
    context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    context.globalAlpha = 0.76;
    context.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);
    context.globalAlpha = 1;
    context.fillStyle = 'rgba(250, 244, 231, 0.12)';
    context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    return context.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
  }

  function installPapyrusPattern() {
    if (!map.getLayer('paper')) return;

    if (map.hasImage(IMAGE_ID)) {
      map.setPaintProperty('paper', 'background-pattern', IMAGE_ID);
      return;
    }

    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      try {
        if (!map.hasImage(IMAGE_ID)) {
          map.addImage(IMAGE_ID, createSoftenedTexture(image), { pixelRatio: 1 });
        }
        map.setPaintProperty('paper', 'background-color', '#e3d4b5');
        map.setPaintProperty('paper', 'background-pattern', IMAGE_ID);
      } catch (error) {
        console.error('Papyrus texture installation failed:', error);
      }
    };
    image.onerror = () => console.error('Papyrus texture image failed to load');
    image.src = TEXTURE_URL;
  }

  if (map.loaded()) installPapyrusPattern();
  else map.once('load', installPapyrusPattern);
})();
