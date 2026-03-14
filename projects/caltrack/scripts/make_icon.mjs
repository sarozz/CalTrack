import sharp from 'sharp';

const outFiles = [
  'assets/icon.png',
  'assets/android-icon-foreground.png',
  'assets/android-icon-background.png',
  'assets/android-icon-monochrome.png',
];

const size = 1024;

// Create a vertical gradient background (navy -> pink)
const gradientSvg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B0F1A"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="220" fill="url(#g)"/>
  <circle cx="260" cy="180" r="420" fill="#FFFFFF" opacity="0.08"/>
</svg>`;

// Foreground mark: stylized C + check
const markSvg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <!-- C ring -->
    <path d="M 700 340 A 240 240 0 1 0 700 684" stroke-width="80" opacity="0.95"/>
    <!-- check -->
    <path d="M 430 550 L 505 625 L 640 470" stroke-width="62" opacity="0.95"/>
  </g>
</svg>`;

async function buildOne(outPath) {
  const bg = sharp(Buffer.from(gradientSvg)).png();
  const mark = sharp(Buffer.from(markSvg)).png();

  const bgBuf = await bg.toBuffer();
  const markBuf = await mark.toBuffer();

  await sharp(bgBuf)
    .composite([{ input: markBuf, blend: 'over' }])
    .png()
    .toFile(outPath);
}

for (const f of outFiles) {
  await buildOne(new URL(`../${f}`, import.meta.url).pathname);
}

console.log('Icon written:', outFiles.join(', '));
