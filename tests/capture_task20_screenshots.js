const path = require('path');
const { chromium } = require(path.resolve('frontend/node_modules/playwright'));
const { spawn } = require('child_process');
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const mode = process.argv[2] || 'before';
const outDir = path.resolve(`artifacts/screenshots/${mode}_task20`);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log(`📸 Capturing Task 20 [${mode.toUpperCase()}] Screenshots...`);

  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: path.resolve('frontend'),
    stdio: 'pipe',
  });

  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});
  await wait(2500);

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '375_mobile', width: 375, height: 812, isMobile: true },
    { name: '430_mobile', width: 430, height: 932, isMobile: true },
    { name: '768_tablet', width: 768, height: 1024, isMobile: false },
    { name: '1280_desktop', width: 1280, height: 800, isMobile: false },
    { name: '1440_desktop', width: 1440, height: 900, isMobile: false },
  ];

  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
    });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

    // Capture fold screenshot
    const foldPath = path.join(outDir, `${vp.name}_fold.png`);
    await page.screenshot({ path: foldPath, fullPage: false });

    // Capture fullpage screenshot
    const fullPath = path.join(outDir, `${vp.name}_full.png`);
    await page.screenshot({ path: fullPath, fullPage: true });

    // Check horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`  ${vp.name}: scrollWidth=${scrollWidth}px (viewport=${vp.width}px), captured fold & full`);

    await ctx.close();
  }

  await browser.close();
  server.kill();
  console.log(`✅ ${mode.toUpperCase()} captures saved in ${outDir}`);
  process.exit(0);
}

capture().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
