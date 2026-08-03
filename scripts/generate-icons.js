// Generates Android and iOS icons from src/assets/player-finance-logo.png
// Requires: npm i sharp

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, '..', 'src', 'assets', 'player-finance-logo.png');
if (!fs.existsSync(src)) {
  console.error('Source logo not found:', src);
  process.exit(1);
}

const androidRes = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const iosAssets = path.resolve(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

const sizes = {
  // Android mipmap densities
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

async function makeAndroid() {
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(androidRes, `mipmap-${folder}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const target = path.join(dir, 'ic_launcher.png');
    await sharp(src).resize(size, size).toFile(target);

    const fg = path.join(dir, 'ic_launcher_foreground.png');
    await sharp(src).resize(size, size).toFile(fg);

    const round = path.join(dir, 'ic_launcher_round.png');
    await sharp(src).resize(size, size).toFile(round);
  }

  // adaptive icon xml (anydpi-v26)
  const anydpi = path.join(androidRes, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpi)) fs.mkdirSync(anydpi, { recursive: true });
  const xml = `<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<adaptive-icon xmlns:android=\"http://schemas.android.com/apk/res/android\">\n  <background android:drawable=\"@mipmap/ic_launcher_foreground\"/>\n  <foreground android:drawable=\"@mipmap/ic_launcher_foreground\"/>\n</adaptive-icon>`;
  fs.writeFileSync(path.join(anydpi, 'ic_launcher.xml'), xml);
  fs.writeFileSync(path.join(anydpi, 'ic_launcher_round.xml'), xml);

  console.log('Android icons generated into', androidRes);
}

async function makeIOS() {
  if (!fs.existsSync(iosAssets)) {
    fs.mkdirSync(iosAssets, { recursive: true });
  }

  // Common iOS sizes for AppIcon.appiconset
  const iosSizes = [
    { name: 'icon-20', size: 20 },
    { name: 'icon-29', size: 29 },
    { name: 'icon-40', size: 40 },
    { name: 'icon-60', size: 60 },
    { name: 'icon-76', size: 76 },
    { name: 'icon-83.5', size: 83.5 },
    { name: 'icon-1024', size: 1024 },
  ];

  const images = [];
  for (const item of iosSizes) {
    const filename = `${item.name}.png`;
    const target = path.join(iosAssets, filename);
    await sharp(src).resize(Math.round(item.size), Math.round(item.size)).toFile(target);
    images.push({ filename, size: item.size });
  }

  const contents = {
    images: images.map((img) => ({
      idiom: 'universal',
      filename: img.filename,
      scale: '1x',
      size: `${img.size}x${img.size}`,
    })),
    info: { version: 1, author: 'xcode' },
  };

  fs.writeFileSync(path.join(iosAssets, 'Contents.json'), JSON.stringify(contents, null, 2));
  console.log('iOS AppIcon.appiconset generated into', iosAssets);
}

(async () => {
  try {
    await makeAndroid();
    await makeIOS();
    console.log('Icon generation complete.');
  } catch (err) {
    console.error('Icon generation failed:', err);
    process.exit(1);
  }
})();
