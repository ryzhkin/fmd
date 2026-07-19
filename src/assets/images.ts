export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

export async function loadOptionalImage(url: string, errorMessage: string): Promise<HTMLImageElement | null> {
  try {
    return await loadImage(url);
  } catch (error) {
    console.warn(`${errorMessage}:`, error);
    return null;
  }
}
