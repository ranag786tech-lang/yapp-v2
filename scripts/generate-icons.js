import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgPath = path.resolve('public/yapp_logo.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 standard icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Created pwa-192x192.png');

  // 512x512 standard icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Created pwa-512x512.png');

  // Apple touch icon 180x180 with solid background
  await sharp(svgBuffer)
    .resize(160, 160)
    .extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 2, g: 6, b: 23, alpha: 1 } // slate-950
    })
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Created apple-touch-icon.png');

  // Maskable icon 512x512 with safe-zone margin (central 80%, padding on all sides, full bleed background)
  const innerLogo = await sharp(svgBuffer)
    .resize(380, 380)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // slate-900 / dark slate
    }
  })
    .composite([{ input: innerLogo, gravity: 'center' }])
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Created pwa-maskable-512x512.png');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
