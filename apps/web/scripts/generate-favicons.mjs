import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { optimize } from 'svgo';

const sizes = {
  favicon: 32,
  apple: 180,
};

async function main() {
  const inputSvg = await fs.readFile('public/favicon.svg', 'utf-8');
  const optimizedSvg = optimize(inputSvg, {
    multipass: true,
  });

  // Generate favicon.ico (32x32)
  await sharp(Buffer.from(optimizedSvg.data))
    .resize(sizes.favicon, sizes.favicon)
    .toFormat('png')
    .toFile('public/favicon.ico');

  // Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(optimizedSvg.data))
    .resize(sizes.apple, sizes.apple)
    .toFormat('png')
    .toFile('public/apple-touch-icon.png');

  console.log('Favicon files generated successfully!');
}

main().catch(console.error); 