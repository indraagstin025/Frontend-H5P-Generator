import type { ElementPosition } from '../constants/h5pModel';

export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

/** Percentage coordinates; the corner opposite the dragged handle stays fixed. */
export function resizeElement(start: ElementPosition, dx: number, dy: number, corner: ResizeCorner, preserveRatio: boolean, rotation = 0, canvasAspect = 16 / 9): ElementPosition {
  if (rotation % 360 !== 0) {
    const radians = rotation * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    const localX = dx * cos + dy / canvasAspect * sin;
    const localY = -dx * canvasAspect * sin + dy * cos;
    const next = resizeElement(start, localX, localY, corner, preserveRatio);
    const centerDx = next.x + next.width / 2 - start.x - start.width / 2;
    const centerDy = next.y + next.height / 2 - start.y - start.height / 2;
    const x = start.x + start.width / 2 + centerDx * cos - centerDy / canvasAspect * sin - next.width / 2;
    const y = start.y + start.height / 2 + centerDx * canvasAspect * sin + centerDy * cos - next.height / 2;
    return { ...next, x: Math.max(0, Math.min(100 - next.width, x)), y: Math.max(0, Math.min(100 - next.height, y)) };
  }
  const west = corner.includes('w');
  const north = corner.includes('n');
  const anchorX = west ? start.x + start.width : start.x;
  const anchorY = north ? start.y + start.height : start.y;
  const maxWidth = Math.max(0, west ? anchorX : 100 - anchorX);
  const maxHeight = Math.max(0, north ? anchorY : 100 - anchorY);
  const changeW = west ? -dx : dx;
  const changeH = north ? -dy : dy;
  let width: number;
  let height: number;
  if (preserveRatio && start.width > 0 && start.height > 0) {
    const desired = 1 + (changeW * start.width + changeH * start.height) / (start.width ** 2 + start.height ** 2);
    const limit = Math.min(maxWidth / start.width, maxHeight / start.height);
    const minimum = Math.min(limit, Math.max(2 / start.width, 2 / start.height));
    const scale = Math.max(minimum, Math.min(limit, desired));
    width = start.width * scale;
    height = start.height * scale;
  } else {
    width = Math.max(Math.min(2, maxWidth), Math.min(maxWidth, start.width + changeW));
    height = Math.max(Math.min(2, maxHeight), Math.min(maxHeight, start.height + changeH));
  }
  return { x: west ? anchorX - width : anchorX, y: north ? anchorY - height : anchorY, width, height };
}
