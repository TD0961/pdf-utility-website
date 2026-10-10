import * as THREE from 'three';

/**
 * Creates a procedural high-fidelity physical paper texture.
 * Generates tactile cotton fiber micro-roughness, subtle edge gradient,
 * and warm archival tones without requiring external image assets.
 */
export function createPhysicalPaperTexture(width = 1024, height = 1448): THREE.CanvasTexture {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1. Base warm architectural ivory tone (pure warm archival cotton rag)
  ctx.fillStyle = '#fcfaf6';
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle soft edge vignette (natural paper contact graduation)
  const grad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    width * 0.2,
    width * 0.5,
    height * 0.5,
    width * 0.8
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(0.8, 'rgba(252, 250, 246, 0.15)');
  grad.addColorStop(1, 'rgba(240, 236, 230, 0.32)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 3. Tactile cotton rag micro-fibers (fine procedural noise)
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    // Ultra-delicate neutral luminance variation (+/- 2.5 levels)
    const grain = (Math.random() - 0.5) * 5;
    data[idx] = Math.min(255, Math.max(0, data[idx] + grain));
    data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain));
    data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // 4. Ultra-fine editorial structural layout (representing an archival document monograph)
  ctx.save();

  // Document Top Rule
  ctx.strokeStyle = 'rgba(70, 65, 60, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 88);
  ctx.lineTo(width - 72, 88);
  ctx.stroke();

  // Header Title & Spec Marker
  ctx.fillStyle = 'rgba(50, 45, 40, 0.28)';
  ctx.font = '600 11px monospace';
  ctx.fillText('DOCUMENT ARCHIVAL SPECIFICATION  •  SERIES 01', 72, 74);
  ctx.textAlign = 'right';
  ctx.fillText('REF / 32000-2', width - 72, 74);
  ctx.textAlign = 'left';

  // Subtle Header Headline Rule
  ctx.strokeStyle = 'rgba(60, 55, 50, 0.07)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(72, 136);
  ctx.lineTo(width * 0.42, 136);
  ctx.stroke();

  // Column Margins & Guide Rules
  const colGap = 40;
  const leftColStart = 72;
  const leftColWidth = (width - 144 - colGap) * 0.5;
  const rightColStart = leftColStart + leftColWidth + colGap;
  const rightColWidth = leftColWidth;

  // Thin Column Divider Guide
  ctx.strokeStyle = 'rgba(70, 65, 60, 0.025)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftColStart + leftColWidth + colGap * 0.5, 170);
  ctx.lineTo(leftColStart + leftColWidth + colGap * 0.5, height - 130);
  ctx.stroke();

  // Spaced Paragraph Lines in Two Architectural Columns
  ctx.strokeStyle = 'rgba(70, 65, 60, 0.038)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  for (let y = 184; y < height - 140; y += 46) {
    // Left column line with natural editorial variation
    const leftVariation = (y * 19) % 23;
    const leftLen = leftColWidth * (0.76 + leftVariation * 0.01);
    ctx.beginPath();
    ctx.moveTo(leftColStart, y);
    ctx.lineTo(leftColStart + leftLen, y);
    ctx.stroke();

    // Right column line with natural editorial variation
    const rightVariation = (y * 29) % 27;
    const rightLen = rightColWidth * (0.72 + rightVariation * 0.01);
    ctx.beginPath();
    ctx.moveTo(rightColStart, y);
    ctx.lineTo(rightColStart + rightLen, y);
    ctx.stroke();
  }

  // Bottom Footer Separation Rule
  ctx.strokeStyle = 'rgba(70, 65, 60, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, height - 92);
  ctx.lineTo(width - 72, height - 92);
  ctx.stroke();

  // Archival Footer Folio
  ctx.fillStyle = 'rgba(50, 45, 40, 0.22)';
  ctx.font = '500 11px monospace';
  ctx.fillText('FOLIO 01 / CLIENT-SIDE RUNTIME', 72, height - 72);
  ctx.textAlign = 'right';
  ctx.fillText('AIR-GAPPED IN-MEMORY PERSISTENCE', width - 72, height - 72);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates procedural normal map to simulate tactile paper surface relief.
 */
export function createPhysicalPaperNormalTexture(width = 512, height = 724): THREE.CanvasTexture {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Flat normal vector base (RGB 128, 128, 255 = Z-up normal)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const total = width * height;

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const perturbX = Math.floor((Math.random() - 0.5) * 12);
    const perturbY = Math.floor((Math.random() - 0.5) * 12);
    data[idx] = Math.min(255, Math.max(0, 128 + perturbX));
    data[idx + 1] = Math.min(255, Math.max(0, 128 + perturbY));
    data[idx + 2] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Factory for creating physically plausible MeshStandardMaterial for paper.
 */
export function createTactilePaperMaterial(isDark = false): THREE.MeshStandardMaterial {
  const paperTexture = createPhysicalPaperTexture();
  const normalTexture = createPhysicalPaperNormalTexture();

  return new THREE.MeshStandardMaterial({
    map: paperTexture,
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(0.04, 0.04),
    roughness: 0.88,
    metalness: 0.02,
    color: isDark ? new THREE.Color(0xf5f3ee) : new THREE.Color(0xffffff),
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
  });
}
