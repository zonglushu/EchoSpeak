/**
 * EchoSpeak PWA Icons Generator
 * 使用 Canvas 生成所有 PWA 所需的图标
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  sizes: [72, 96, 128, 144, 152, 192, 384, 512],
  colors: {
    primary: '#0F172A',
    secondary: '#1E293B',
    accent: '#3B82F6',
    accentDark: '#2563EB',
    white: '#FFFFFF'
  },
  outputDir: path.join(__dirname, '../public/icons')
};

// 确保输出目录存在
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * 创建 SVG 图标
 */
function createSVG(size, isMaskable = false) {
  const { primary, secondary, accent, accentDark, white } = CONFIG.colors;
  const padding = isMaskable ? size * 0.15 : 0;
  const safeSize = size - padding * 2;
  const center = size / 2;
  const radius = safeSize * 0.35;

  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;

  // 背景
  if (isMaskable) {
    svg += `<rect width="${size}" height="${size}" fill="${primary}"/>`;
    svg += `<rect x="${padding}" y="${padding}" width="${safeSize}" height="${safeSize}" fill="${secondary}" rx="12"/>`;
  } else {
    svg += `<rect width="${size}" height="${size}" fill="${primary}"/>`;
  }

  // 渐变定义
  svg += `
    <defs>
      <radialGradient id="grad-${size}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${accent};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${accentDark};stop-opacity:1" />
      </radialGradient>
    </defs>
  `;

  // 背景圆
  svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="url(#grad-${size})"/>`;

  // 声波纹装饰
  for (let i = 1; i <= 3; i++) {
    const waveRadius = radius + size * 0.05 * i;
    svg += `<path d="M ${center - waveRadius} ${center}
                  A ${waveRadius} ${waveRadius} 0 0 1 ${center - waveRadius * Math.cos(0.3 * Math.PI)} ${center + waveRadius * Math.sin(0.3 * Math.PI)}"
          fill="none" stroke="${accent}" stroke-width="${size * 0.02}" opacity="0.5"/>`;
  }

  // "ES" 文字
  const fontSize = size * 0.35;
  svg += `
    <text x="${center}" y="${center + size * 0.12}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          fill="${white}"
          text-anchor="middle">ES</text>
  `;

  svg += `</svg>`;
  return svg;
}

/**
 * 创建 HTML 文件用于转换为 PNG
 */
function createHTMLConverter() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Icon Generator</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    .icon-container { display: inline-block; margin: 10px; text-align: center; }
    canvas { border: 1px solid #ccc; }
    h2 { color: #0F172A; }
    button { background: #3B82F6; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; }
    button:hover { background: #2563EB; }
  </style>
</head>
<body>
  <h2>EchoSpeak PWA Icons Generator</h2>
  <button onclick="generateAll()">Generate All</button>
  <button onclick="downloadAll()" style="background: #22C55E;">Download All</button>
  <div id="container"></div>

  <script>
    const CONFIG = {
      sizes: [72, 96, 128, 144, 152, 192, 384, 512],
      colors: {
        primary: '#0F172A',
        secondary: '#1E293B',
        accent: '#3B82F6',
        accentDark: '#2563EB',
        white: '#FFFFFF'
      }
    };

    let canvases = [];

    function drawIcon(canvas, size, isMaskable = false) {
      const ctx = canvas.getContext('2d');
      const { primary, secondary, accent, accentDark, white } = CONFIG.colors;
      const padding = isMaskable ? size * 0.15 : 0;
      const safeSize = size - padding * 2;
      const center = size / 2;
      const radius = safeSize * 0.35;

      // 背景
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, size, size);

      if (isMaskable) {
        ctx.fillStyle = secondary;
        roundRect(ctx, padding, padding, safeSize, safeSize, 12);
        ctx.fill();
      }

      // 渐变圆
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
      gradient.addColorStop(0, accent);
      gradient.addColorStop(1, accentDark);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();

      // 声波纹
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.02;
      ctx.globalAlpha = 0.5;

      for (let i = 1; i <= 3; i++) {
        const waveRadius = radius + size * 0.05 * i;
        ctx.beginPath();
        ctx.arc(center, center, waveRadius, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // "ES" 文字
      ctx.fillStyle = white;
      ctx.font = \`bold \${size * 0.35}px Arial, sans-serif\`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ES', center, center + size * 0.02);
    }

    function roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function generateAll() {
      const container = document.getElementById('container');
      container.innerHTML = '';
      canvases = [];

      CONFIG.sizes.forEach(size => {
        const wrapper = document.createElement('div');
        wrapper.className = 'icon-container';

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        drawIcon(canvas, size, false);

        const label = document.createElement('div');
        label.textContent = \`icon-\${size}x\${size}.png\`;

        wrapper.appendChild(canvas);
        wrapper.appendChild(label);
        container.appendChild(wrapper);

        canvases.push({ name: \`icon-\${size}x\${size}.png\`, canvas });
      });

      // Maskable icon
      const maskableCanvas = document.createElement('canvas');
      maskableCanvas.width = 512;
      maskableCanvas.height = 512;
      drawIcon(maskableCanvas, 512, true);

      const maskableWrapper = document.createElement('div');
      maskableWrapper.className = 'icon-container';
      maskableWrapper.innerHTML = '<canvas id="maskable"></canvas><div>icon-maskable-512x512.png</div>';
      maskableWrapper.querySelector('#maskable').getContext('2d').drawImage(maskableCanvas, 0, 0);
      container.appendChild(maskableWrapper);

      canvases.push({ name: 'icon-maskable-512x512.png', canvas: maskableCanvas });

      // Continue icon
      const continueCanvas = document.createElement('canvas');
      continueCanvas.width = 96;
      continueCanvas.height = 96;
      drawIcon(continueCanvas, 96, false);

      const continueWrapper = document.createElement('div');
      continueWrapper.className = 'icon-container';
      continueWrapper.innerHTML = '<canvas id="continue"></canvas><div>continue-96x96.png</div>';
      continueWrapper.querySelector('#continue').getContext('2d').drawImage(continueCanvas, 0, 0);
      container.appendChild(continueWrapper);

      canvases.push({ name: 'continue-96x96.png', canvas: continueCanvas });
    }

    function downloadAll() {
      if (canvases.length === 0) {
        alert('Please generate icons first!');
        return;
      }

      canvases.forEach(({ name, canvas }) => {
        const link = document.createElement('a');
        link.download = name;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });

      alert(\`Downloaded \${canvases.length} icons!\\n\\nSave them to: apps/learner/public/icons/\`);
    }

    // Auto-generate on load
    window.onload = generateAll;
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'generate-icons.html'), html);
  console.log('✓ Created generate-icons.html');
}

/**
 * 生成 SVG 文件
 */
function generateSVGs() {
  // 常规图标
  CONFIG.sizes.forEach(size => {
    const svg = createSVG(size, false);
    const filename = path.join(CONFIG.outputDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`✓ Generated icon-${size}x${size}.svg`);
  });

  // 自适应图标
  const maskableSVG = createSVG(512, true);
  fs.writeFileSync(path.join(CONFIG.outputDir, 'icon-maskable-512x512.svg'), maskableSVG);
  console.log('✓ Generated icon-maskable-512x512.svg');

  // 快捷方式图标
  const continueSVG = createSVG(96, false);
  fs.writeFileSync(path.join(CONFIG.outputDir, 'continue-96x96.svg'), continueSVG);
  console.log('✓ Generated continue-96x96.svg');
}

/**
 * 创建简单的占位符 PNG（使用 base64）
 */
function createPlaceholderPNG() {
  // 创建一个 1x1 的蓝色 PNG
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk start
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
    0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  // 为每个尺寸创建占位符
  CONFIG.sizes.forEach(size => {
    const filename = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(filename, png);
    console.log(`✓ Created placeholder icon-${size}x${size}.png`);
  });
}

// 执行生成
console.log('\n🎨 EchoSpeak PWA Icons Generator\n');
console.log('Generating SVG icons...');
generateSVGs();

console.log('\nGenerating HTML converter...');
createHTMLConverter();

console.log('\nGenerating PNG placeholders...');
createPlaceholderPNG();

console.log('\n✨ Icons generated successfully!\n');
console.log('Next steps:');
console.log('1. Open: apps/learner/scripts/generate-icons.html in browser');
console.log('2. Click "Download All" to get PNG icons');
console.log('3. Save downloaded files to: apps/learner/public/icons/\n');
console.log('Note: SVG icons are ready to use immediately!\n');
