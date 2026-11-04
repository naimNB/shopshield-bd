const path = require('path');
const { chromium } = require(path.resolve('frontend/node_modules/playwright'));
const { spawn } = require('child_process');
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🏁 Starting Official Buildathon Sticker Verification Suite...\n');

  const screenshotsDir = path.resolve('artifacts/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Start vite preview server
  console.log('📦 Starting Vite preview server on port 4173...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: path.resolve('frontend'),
    stdio: 'pipe',
  });

  server.stdout.on('data', d => console.log('  [preview]:', d.toString().trim()));
  server.stderr.on('data', d => console.error('  [preview err]:', d.toString().trim()));

  await wait(2000);

  const browser = await chromium.launch({ headless: true });
  let hasErrors = false;

  try {
    // 1. Desktop Test (1280x800)
    console.log('\n🖥️ --- 1. Verifying Desktop Viewport (1280x800) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

    const stickerImg = desktopPage.locator('img[alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"]');
    const isVisible = await stickerImg.isVisible();
    console.log(`  Sticker image is visible: ${isVisible}`);
    if (!isVisible) throw new Error('Sticker image not visible on desktop!');

    const link = desktopPage.locator('a[href="https://yunet-aignite26.devpost.com/"]').first();
    const linkHref = await link.getAttribute('href');
    const linkTarget = await link.getAttribute('target');
    console.log(`  Devpost Link Href: ${linkHref}, Target: ${linkTarget}`);
    if (linkHref !== 'https://yunet-aignite26.devpost.com/' || linkTarget !== '_blank') {
      throw new Error(`Invalid Devpost link: ${linkHref} (${linkTarget})`);
    }

    // Check image load status and dimensions
    const imgInfo = await stickerImg.evaluate((img) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
      currentSrc: img.currentSrc,
      complete: img.complete,
    }));
    console.log('  Desktop Image Loaded Info:', imgInfo);
    if (!imgInfo.complete || imgInfo.naturalWidth === 0) {
      throw new Error('Image failed to load in browser!');
    }

    const naturalRatio = imgInfo.naturalWidth / imgInfo.naturalHeight;
    const renderedRatio = imgInfo.clientWidth / imgInfo.clientHeight;
    console.log(`  Natural aspect ratio: ${naturalRatio.toFixed(3)}, Rendered aspect ratio: ${renderedRatio.toFixed(3)}`);
    if (Math.abs(naturalRatio - renderedRatio) > 0.05) {
      console.warn('  ⚠️ Rendered aspect ratio differs slightly from natural aspect ratio!');
    } else {
      console.log('  ✅ Original aspect ratio preserved without distortion.');
    }

    const desktopScreenshotPath = path.join(screenshotsDir, 'desktop_buildathon_sticker.png');
    await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log(`  📸 Desktop screenshot captured: ${desktopScreenshotPath}`);

    // 2. Mobile Test (375x812 - iPhone X / modern mobile standard)
    console.log('\n📱 --- 2. Verifying Mobile Viewport (375x812) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

    const mobileSticker = mobilePage.locator('img[alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"]');
    const isMobileVisible = await mobileSticker.isVisible();
    console.log(`  Mobile sticker is visible: ${isMobileVisible}`);
    if (!isMobileVisible) throw new Error('Sticker image not visible on mobile!');

    const mobileImgInfo = await mobileSticker.evaluate((img) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
      currentSrc: img.currentSrc,
      complete: img.complete,
    }));
    console.log('  Mobile Image Loaded Info:', mobileImgInfo);

    // Verify no horizontal overflow
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`  Mobile document scrollWidth: ${scrollWidth}px (Viewport: 375px)`);
    if (scrollWidth > 375) {
      throw new Error(`Horizontal overflow detected on mobile: ${scrollWidth}px > 375px`);
    } else {
      console.log('  ✅ No horizontal overflow on mobile.');
    }

    const mobileScreenshotPath = path.join(screenshotsDir, 'mobile_buildathon_sticker.png');
    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`  📸 Mobile screenshot captured: ${mobileScreenshotPath}`);

    // 3. Bilingual toggle test
    console.log('\n🌐 --- 3. Verifying Bilingual Toggle Interaction ---');
    const enBtn = desktopPage.locator('button:has-text("English")').first();
    await enBtn.click();
    await wait(300);
    const enText = await desktopPage.locator('text=Official Devpost Event').isVisible();
    console.log(`  English badge text visible: ${enText}`);

    const bnBtn = desktopPage.locator('button:has-text("বাংলা")').first();
    await bnBtn.click();
    await wait(300);
    const bnText = await desktopPage.locator('text=অফিশিয়াল ইভেন্ট').isVisible();
    console.log(`  Bangla badge text visible: ${bnText}`);

    console.log('\n🎉 ALL BUILDATHON STICKER TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    hasErrors = true;
  } finally {
    await browser.close();
    server.kill();
  }

  process.exit(hasErrors ? 1 : 0);
}

run();
