const path = require('path');
const { chromium } = require(path.resolve('frontend/node_modules/playwright'));
const { spawn } = require('child_process');
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('📸 Capturing BEFORE screenshots for Task 19 Visual Alignment Audit...\n');
  const beforeDir = path.resolve('artifacts/screenshots/before_task19');
  if (!fs.existsSync(beforeDir)) {
    fs.mkdirSync(beforeDir, { recursive: true });
  }

  // Start vite preview on port 4173
  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: path.resolve('frontend'),
    stdio: 'pipe',
  });

  server.stdout.on('data', d => {});
  server.stderr.on('data', d => {});
  await wait(2000);

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '375_mobile', width: 375, height: 812, isMobile: true },
    { name: '430_mobile', width: 430, height: 932, isMobile: true },
    { name: '768_tablet', width: 768, height: 1024, isMobile: false },
    { name: '1280_desktop', width: 1280, height: 800, isMobile: false },
    { name: '1440_desktop', width: 1440, height: 900, isMobile: false },
    { name: '1600_desktop', width: 1600, height: 1000, isMobile: false },
  ];

  for (const vp of viewports) {
    console.log(`Evaluating viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
    });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

    // Measure bounding boxes of section outer containers
    const measurements = await page.evaluate(() => {
      const getBox = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          selector,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          classes: el.className,
        };
      };

      return {
        headerContainer: getBox('header > div'),
        heroBannerContainer: getBox('section:has(img[alt*="Buildathon"]) > div:first-child'),
        heroContentContainer: getBox('section:has(h1) > div:nth-child(2)'),
        verificationContainer: getBox('#analyzer > div'),
        verificationTabs: getBox('#analyzer [role="tablist"]'),
        verificationPanel: getBox('#tabpanel-ad-check > div'),
        howItWorksContainer: getBox('#how-it-works > div'),
        aboutContainer: getBox('#about > div'),
        footerContainer: getBox('footer > div'),
      };
    });

    console.log(`  Container widths for ${vp.name}:`);
    for (const [k, v] of Object.entries(measurements)) {
      if (v) {
        console.log(`    ${k.padEnd(24)}: width=${v.width}px, x=${v.x}px`);
      } else {
        console.log(`    ${k.padEnd(24)}: null`);
      }
    }

    const screenshotPath = path.join(beforeDir, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  Saved screenshot: ${screenshotPath}\n`);

    await ctx.close();
  }

  await browser.close();
  server.kill();
  console.log('✅ Before capture complete!');
  process.exit(0);
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
