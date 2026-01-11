/**
 * SVG to PNG Converter using Sharp
 * 将 SVG 图标转换为 PNG 格式
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function convertSVGToPNG() {
  console.log('🎨 Converting SVG icons to PNG...\n');

  // 转换常规图标
  for (const size of SIZES) {
    const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
    const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

    try {
      // 读取 SVG
      const svgBuffer = fs.readFileSync(svgPath);

      // 使用 sharp 转换
      await sharp(svgBuffer, { density: 300 })
        .resize(size, size)
        .png()
        .toFile(pngPath);

      const stats = fs.statSync(pngPath);
      console.log(`✓ Generated icon-${size}x${size}.png (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`✗ Failed to convert icon-${size}x${size}:`, error.message);
    }
  }

  // 转换自适应图标
  const maskableSVG = path.join(ICONS_DIR, 'icon-maskable-512x512.svg');
  const maskablePNG = path.join(ICONS_DIR, 'icon-maskable-512x512.png');

  try {
    const maskableBuffer = fs.readFileSync(maskableSVG);
    await sharp(maskableBuffer, { density: 300 })
      .resize(512, 512)
      .png()
      .toFile(maskablePNG);

    const stats = fs.statSync(maskablePNG);
    console.log(`✓ Generated icon-maskable-512x512.png (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error('✗ Failed to convert maskable icon:', error.message);
  }

  // 转换快捷方式图标
  const continueSVG = path.join(ICONS_DIR, 'continue-96x96.svg');
  const continuePNG = path.join(ICONS_DIR, 'continue-96x96.png');

  try {
    const continueBuffer = fs.readFileSync(continueSVG);
    await sharp(continueBuffer, { density: 300 })
      .resize(96, 96)
      .png()
      .toFile(continuePNG);

    const stats = fs.statSync(continuePNG);
    console.log(`✓ Generated continue-96x96.png (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error('✗ Failed to convert continue icon:', error.message);
  }

  console.log('\n✨ All PNG icons generated successfully!\n');

  // 统计信息
  const pngFiles = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.png'));
  console.log(`Total PNG files: ${pngFiles.length}`);

  let totalSize = 0;
  pngFiles.forEach(file => {
    const stats = fs.statSync(path.join(ICONS_DIR, file));
    totalSize += stats.size;
  });

  console.log(`Total size: ${(totalSize / 1024).toFixed(1)} KB\n`);
}

convertSVGToPNG().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
