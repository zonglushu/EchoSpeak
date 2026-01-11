/**
 * 使用 Puppeteer 生成高质量 PNG 图标
 * 需要先安装: npm install -D puppeteer
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../public/icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// HTML 模板
const HTML_TEMPLATE = (size) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; width: ${size}px; height: ${size}px; }
    svg { display: block; }
  </style>
</head>
<body>
  ${fs.readFileSync(path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`), 'utf8')}
</body>
</html>
`;

async function generatePNGs() {
  console.log('🎨 Generating PNG icons using browser...\n');

  // 检查是否安装了 puppeteer
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.log('❌ Puppeteer not found. Installing...\n');
    console.log('Run: npm install -D puppeteer\n');
    console.log('Or use the manual method:\n');
    console.log('1. Open: apps/learner/scripts/generate-icons.html');
    console.log('2. Click "Download All"');
    console.log('3. Save files to: apps/learner/public/icons/\n');
    return;
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const size of SIZES) {
    const html = HTML_TEMPLATE(size);

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: size, height: size });

    const svgElement = await page.$('svg');
    if (svgElement) {
      // 使用 Chrome DevTools Protocol 截取 SVG
      const screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: size, height: size }
      });

      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      fs.writeFileSync(outputPath, screenshot);
      console.log(`✓ Generated icon-${size}x${size}.png`);
    }
  }

  // 生成 maskable 图标
  const maskableHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; width: 512px; height: 512px; }
    svg { display: block; }
  </style>
</head>
<body>
  ${fs.readFileSync(path.join(OUTPUT_DIR, 'icon-maskable-512x512.svg'), 'utf8')}
</body>
</html>`;

  await page.setContent(maskableHTML, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 512, height: 512 });

  const maskableScreenshot = await page.screenshot({
    clip: { x: 0, y: 0, width: 512, height: 512 }
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'icon-maskable-512x512.png'), maskableScreenshot);
  console.log('✓ Generated icon-maskable-512x512.png');

  // 生成 continue 图标
  const continueHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; width: 96px; height: 96px; }
    svg { display: block; }
  </style>
</head>
<body>
  ${fs.readFileSync(path.join(OUTPUT_DIR, 'continue-96x96.svg'), 'utf8')}
</body>
</html>`;

  await page.setContent(continueHTML, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 96, height: 96 });

  const continueScreenshot = await page.screenshot({
    clip: { x: 0, y: 0, width: 96, height: 96 }
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'continue-96x96.png'), continueScreenshot);
  console.log('✓ Generated continue-96x96.png');

  await browser.close();

  console.log('\n✨ All PNG icons generated successfully!\n');
}

generatePNGs().catch(console.error);
