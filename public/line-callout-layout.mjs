// Prefix counts of occupied tiles from the transparent equipment image.
export function readOccupancy(columns, rows, encoded) {
  const bits = atob(encoded);
  const stride = columns + 1;
  const prefix = new Uint16Array(stride * (rows + 1));
  for (let y = 0; y < rows; y++) {
    let count = 0;
    for (let x = 0; x < columns; x++) {
      const index = y * columns + x;
      count += (bits.charCodeAt(index >> 3) >> (index & 7)) & 1;
      prefix[(y + 1) * stride + x + 1] = prefix[y * stride + x + 1] + count;
    }
  }
  return { columns, rows, stride, prefix };
}

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function intersectsModel(rect, scene, { columns, rows, stride, prefix }) {
  const tileX = x => clamp((x - scene.left) * columns / scene.width, 0, columns);
  const tileY = y => clamp((y - scene.top) * rows / scene.height, 0, rows);
  const x0 = Math.floor(tileX(rect.left)), x1 = Math.ceil(tileX(rect.right));
  const y0 = Math.floor(tileY(rect.top)), y1 = Math.ceil(tileY(rect.bottom));
  return prefix[y1 * stride + x1] + prefix[y0 * stride + x0] -
    prefix[y1 * stride + x0] - prefix[y0 * stride + x1] > 0;
}

function overlaps(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function segmentCrosses(a, b, box) {
  // Clip the segment's parameter interval to the four sides of the box.
  let enter = 0, leave = 1;
  for (const [axis, min, max] of [[0, box.left, box.right], [1, box.top, box.bottom]]) {
    const delta = b[axis] - a[axis];
    if (delta === 0) {
      if (a[axis] < min || a[axis] > max) return false;
      continue;
    }
    const first = (min - a[axis]) / delta, last = (max - a[axis]) / delta;
    enter = Math.max(enter, Math.min(first, last));
    leave = Math.min(leave, Math.max(first, last));
    if (enter > leave) return false;
  }
  return true;
}

function positions(low, high, nearby) {
  const available = new Set([low, high, ...nearby.map(value => clamp(value, low, high))]);
  for (let value = low + 12; value < high; value += 12) available.add(value);
  return available;
}

export function findCalloutPosition({ bounds, scene, pin, size, occupancy, markers, leaders }) {
  const { width, height } = size;
  const right = bounds.right - width, bottom = bounds.bottom - height;
  if (!occupancy || !scene.width || !scene.height || right < bounds.left || bottom < bounds.top) return null;

  const gap = 10;
  const x = pin.left + pin.width / 2, y = pin.top + pin.height / 2;
  const horizontal = positions(bounds.left, right, [x - width / 2, pin.right + gap, pin.left - width - gap]);
  const vertical = positions(bounds.top, bottom, [y - height / 2, pin.bottom + gap, pin.top - height - gap]);
  const clearance = Math.max(8, scene.width * .004);
  let best = null, bestScore = Infinity;

  for (const top of vertical) {
    for (const left of horizontal) {
      const end = left + width, base = top + height;
      const edgeDistance = Math.hypot(x - clamp(x, left, end), y - clamp(y, top, base));
      const centerDistance = Math.hypot(x - left - width / 2, y - top - height / 2);
      const score = edgeDistance + centerDistance * .2;
      if (score >= bestScore) continue;

      const padded = { left: left - clearance, top: top - clearance, right: end + clearance, bottom: base + clearance };
      if (intersectsModel(padded, scene, occupancy)) continue;
      if (markers.some(marker => overlaps(padded, marker))) continue;
      if (leaders.some(points => points.some((point, i) => i > 0 && segmentCrosses(points[i - 1], point, padded)))) continue;

      best = { left, top };
      bestScore = score;
    }
  }

  return best;
}
