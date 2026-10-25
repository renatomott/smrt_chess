import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgPath = path.resolve('public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. PWA 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 2. PWA 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 4. Maskable 512x512 (with 12% safe-zone margin)
  const innerSize = Math.round(512 * 0.8); // 410px
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 }, // #09090b
    },
  })
    .composite([
      {
        input: innerBuffer,
        top: Math.round((512 - innerSize) / 2),
        left: Math.round((512 - innerSize) / 2),
      },
    ])
    .png()
    .toFile(path.resolve('public/pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 5. Favicon 48x48 PNG
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.resolve('public/favicon.png'));
  console.log('Generated favicon.png');
}

generate().catch(console.error);
