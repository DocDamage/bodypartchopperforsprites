export function computeAlphaBoundingBox(imageData, width, height, alphaThreshold = 8) {
  if (!imageData || !imageData.length || !width || !height) {
    return { empty: true, x: 0, y: 0, w: 0, h: 0 };
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = imageData[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return { empty: true, x: 0, y: 0, w: 0, h: 0 };
  return { empty: false, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function boxTouchesEdge(box, frameWidth, frameHeight) {
  if (!box || box.empty) return false;
  return box.x <= 0 || box.y <= 0 || box.x + box.w >= frameWidth || box.y + box.h >= frameHeight;
}

export function boxCenter(box) {
  if (!box || box.empty) return { x: 0, y: 0 };
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

export function boxBottomCenter(box) {
  if (!box || box.empty) return { x: 0, y: 0 };
  return { x: box.x + box.w / 2, y: box.y + box.h };
}

export function summarizeFrameBoxes(frameBoxes = []) {
  const visible = frameBoxes.filter((box) => !box.empty);
  return {
    total: frameBoxes.length,
    empty: frameBoxes.length - visible.length,
    visible: visible.length,
    edgeTouching: visible.filter((box) => box.touchesEdge).length,
    averageWidth: average(visible.map((box) => box.w)),
    averageHeight: average(visible.map((box) => box.h))
  };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
