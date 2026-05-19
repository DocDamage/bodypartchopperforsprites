export async function loadSourceImage(file) {
  if (!file) throw new Error('No file provided');
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);
  const format = inferFormat(file.name);
  const canvas = imageToCanvas(img);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const mode = inferMode(imageData.data, canvas.width, canvas.height);

  return {
    file_name: file.name,
    width: img.naturalWidth,
    height: img.naturalHeight,
    format,
    mode,
    dataUrl,
    image: img,
    canvas,
    ctx,
    imageData
  };
}

export function imageToCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export function getPixelAt(imageData, x, y) {
  const idx = (y * imageData.width + x) * 4;
  return [
    imageData.data[idx],
    imageData.data[idx + 1],
    imageData.data[idx + 2],
    imageData.data[idx + 3]
  ];
}

function inferFormat(fileName) {
  const ext = String(fileName).split('.').pop().toLowerCase();
  if (ext === 'gif') return 'gif';
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  return 'unknown';
}

function inferMode(data, width, height) {
  let hasAlpha = false;
  let allOpaque = true;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      hasAlpha = true;
      if (data[i] > 0) allOpaque = false;
    }
  }
  if (hasAlpha && !allOpaque) return 'rgba';
  if (hasAlpha && allOpaque) {
    // Could be RGB with full alpha; check for indexed-like behavior
    return 'rgba';
  }
  return 'rgb';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
