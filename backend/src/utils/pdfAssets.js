'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetPath = (fileName, envNames = []) => [
  ...envNames.map((name) => (process.env[name] ? path.resolve(process.env[name]) : null)),
  path.resolve(__dirname, '../../assets', fileName),
  path.resolve(process.cwd(), 'assets', fileName),
  path.resolve(process.cwd(), 'backend/assets', fileName),
  path.resolve(__dirname, '../../../frontend/public', fileName),
  path.resolve(__dirname, '../../../../frontend/public', fileName),
  path.resolve(__dirname, '../../../docs', fileName),
  path.resolve(__dirname, '../../../../docs', fileName),
  path.resolve(process.cwd(), '../frontend/public', fileName),
  path.resolve(process.cwd(), '../docs', fileName),
  path.resolve(process.cwd(), 'frontend/public', fileName),
  path.resolve(process.cwd(), 'docs', fileName)
].filter(Boolean);

const resolveAssetPath = (fileName, envNames = []) => {
  const seen = new Set();
  return assetPath(fileName, envNames).find((candidate) => {
    if (seen.has(candidate)) return false;
    seen.add(candidate);
    return fs.existsSync(candidate);
  });
};

const LETTERHEAD_PATHS = assetPath('letterhead.png', ['PDF_LETTERHEAD_PATH', 'LETTERHEAD_PATH']);

const imageBoundsCache = new Map();

const resolveLetterheadPath = () => resolveAssetPath('letterhead.png', ['PDF_LETTERHEAD_PATH', 'LETTERHEAD_PATH']);

const paethPredictor = (left, up, upLeft) => {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
};

const getVisibleImageBounds = (image, imagePath) => {
  if (imageBoundsCache.has(imagePath)) return imageBoundsCache.get(imagePath);

  const fallbackBounds = {
    minX: 0,
    minY: 0,
    maxX: image.width - 1,
    maxY: image.height - 1
  };

  const png = image.image;
  if (!png?.hasAlphaChannel || png.interlaceMethod !== 0 || !png.imgData) {
    imageBoundsCache.set(imagePath, fallbackBounds);
    return fallbackBounds;
  }

  let bounds = null;
  try {
    const colorCount = png.colors || 3;
    const bytesPerComponent = png.bits === 16 ? 2 : 1;
    const bytesPerPixel = png.pixelBitlength / 8;
    const alphaOffset = colorCount * bytesPerComponent;
    const scanlineLength = image.width * bytesPerPixel;
    const inflated = zlib.inflateSync(png.imgData);
    let pos = 0;
    let previousRow = Buffer.alloc(scanlineLength);
    let minX = image.width;
    let minY = image.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < image.height; y += 1) {
      const filterType = inflated[pos++];
      const row = Buffer.alloc(scanlineLength);

      for (let i = 0; i < scanlineLength; i += 1) {
        const raw = inflated[pos++];
        const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0;
        const up = previousRow[i] || 0;
        const upLeft = i >= bytesPerPixel ? previousRow[i - bytesPerPixel] : 0;

        switch (filterType) {
          case 0:
            row[i] = raw;
            break;
          case 1:
            row[i] = (raw + left) & 0xff;
            break;
          case 2:
            row[i] = (raw + up) & 0xff;
            break;
          case 3:
            row[i] = (raw + Math.floor((left + up) / 2)) & 0xff;
            break;
          case 4:
            row[i] = (raw + paethPredictor(left, up, upLeft)) & 0xff;
            break;
          default:
            row[i] = raw;
        }
      }

      for (let x = 0; x < image.width; x += 1) {
        const alpha = row[(x * bytesPerPixel) + alphaOffset];
        if (alpha > 8) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }

      previousRow = row;
    }

    if (maxX >= minX && maxY >= minY) {
      bounds = { minX, minY, maxX, maxY };
    }
  } catch (_) {}

  const resolvedBounds = bounds || fallbackBounds;
  imageBoundsCache.set(imagePath, resolvedBounds);
  return resolvedBounds;
};

const drawLetterheadImage = (doc, options = {}) => {
  const letterheadPath = resolveLetterheadPath();
  if (!letterheadPath) return null;

  const pageWidth = doc.page.width;
  const {
    x = 0,
    y = 18,
    width = pageWidth,
    maxHeight = 150,
    align = 'center'
  } = options;

  try {
    const image = doc.openImage(letterheadPath);
    const visibleBounds = getVisibleImageBounds(image, letterheadPath);
    const aspectRatio = image.height / image.width;
    let renderWidth = width;
    let renderHeight = renderWidth * aspectRatio;

    if (maxHeight && renderHeight > maxHeight) {
      renderHeight = maxHeight;
      renderWidth = renderHeight / aspectRatio;
    }

    const scale = renderWidth / image.width;
    const visibleCenterX = ((visibleBounds.minX + visibleBounds.maxX) / 2) * scale;
    const drawX = align === 'center' ? x + (width / 2) - visibleCenterX : x;
    doc.image(letterheadPath, drawX, y, { width: renderWidth });

    return {
      path: letterheadPath,
      x: drawX,
      y,
      width: renderWidth,
      height: renderHeight,
      bottom: y + renderHeight
    };
  } catch (_) {
    return null;
  }
};

module.exports = {
  LETTERHEAD_PATHS,
  resolveAssetPath,
  drawLetterheadImage,
  resolveLetterheadPath
};
