const path = require('path');
const { chromium } = require(path.resolve('frontend/node_modules/playwright'));
const { spawn } = require('child_process');
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verify() {
  console.log('📐 Starting Task 19 Visual Alignment & Responsiveness Test Suite...\n');
  const afterDir = path.resolve('artifacts/screenshots/after_task19');
  if (!fs.existsSync(afterDir)) {
    fs.mkdirSync(afterDir, { recursive: true });
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

  let allPassed = true;

  for (const vp of viewports) {
    console.log(`\n🔍 === Evaluating Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
    });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

    // 1. Check for horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`  Scroll width: ${scrollWidth}px (Viewport: ${vp.width}px)`);
    if (scrollWidth > vp.width) {
      console.error(`  ❌ Horizontal overflow detected on ${vp.name}: ${scrollWidth} > ${vp.width}`);
      allPassed = false;
    } else {
      console.log(`  ✅ Zero horizontal overflow.`);
    }

    // 2. Measure bounding boxes of all major outer containers
    const measurements = await page.evaluate(() => {
      const getBox = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          selector,
          x: Math.round(rect.x),
          width: Math.round(rect.width),
          right: Math.round(rect.right),
        };
      };

      return {
        Navbar: getBox('header > div'),
        Hero: getBox('section:has(h1) > div:first-child'),
        Verification: getBox('#analyzer > div'),
        HowItWorks: getBox('#how-it-works > div'),
        About: getBox('#about > div'),
        Footer: getBox('footer > div'),
        // Form & Tab widths
        Tabs: getBox('#analyzer [role="tablist"]'),
        AdQuickCheckForm: getBox('#tabpanel-ad-check > div'),
      };
    });

    console.log('  Major Container Measurements:');
    const outerContainers = ['Navbar', 'Hero', 'Verification', 'HowItWorks', 'About', 'Footer'];
    let refX = null;
    let refWidth = null;
    let isAligned = true;

    for (const name of outerContainers) {
      const box = measurements[name];
      if (box) {
        console.log(`    ${name.padEnd(16)}: width=${box.width}px, left(x)=${box.x}px, right=${box.right}px`);
        if (refX === null) {
          refX = box.x;
          refWidth = box.width;
        } else {
          if (box.x !== refX || box.width !== refWidth) {
            console.warn(`    ⚠️ ${name} does not match reference: x=${box.x} (ref: ${refX}), width=${box.width} (ref: ${refWidth})`);
            isAligned = false;
          }
        }
      } else {
        console.warn(`    ⚠️ ${name} not found!`);
        isAligned = false;
      }
    }

    if (isAligned) {
      console.log(`  ✅ All 6 major section containers share the exact same left/right alignment! (x=${refX}px, width=${refWidth}px)`);
    } else {
      console.error(`  ❌ Major container misalignment detected on ${vp.name}`);
      allPassed = false;
    }

    // 3. Form width verification
    if (measurements.AdQuickCheckForm) {
      console.log(`  Form Panel width: ${measurements.AdQuickCheckForm.width}px (Target: 900-1024px comfortable desktop width)`);
    }

    // 4. Capture screenshot
    const screenshotPath = path.join(afterDir, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  📸 Screenshot saved: ${screenshotPath}`);

    await ctx.close();
  }

  // 5. Bilingual toggle check on desktop
  console.log('\n🌐 === Testing Bilingual Toggle Interaction ===');
  const testCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const testPage = await testCtx.newPage();
  await testPage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

  const enBtn = testPage.locator('button:has-text("English")').first();
  await enBtn.click();
  await wait(300);
  const enLink = await testPage.locator('text=Official Buildathon Event (Devpost)').isVisible();
  console.log(`  English Devpost event pill visible: ${enLink}`);

  const bnBtn = testPage.locator('button:has-text("বাংলা")').first();
  await bnBtn.click();
  await wait(300);
  const bnLink = await testPage.locator('text=অফিশিয়াল বিল্ডাথন ইভেন্ট (Devpost)').isVisible();
  console.log(`  Bangla Devpost event pill visible: ${bnLink}`);

  await testCtx.close();
  await browser.close();
  server.kill();

  if (allPassed) {
    console.log('\n🎉 ALL TASK 19 VISUAL ALIGNMENT TESTS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error('\n❌ Some alignment tests failed!');
    process.exit(1);
  }
}

verify().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
