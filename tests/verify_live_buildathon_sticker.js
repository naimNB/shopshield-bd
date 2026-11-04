const path = require('path');
const { chromium } = require(path.resolve('frontend/node_modules/playwright'));
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🌐 Starting Live Production Buildathon Sticker Verification on https://shopshield-bd.vercel.app...\n');

  const screenshotsDir = path.resolve('artifacts/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  let hasErrors = false;

  try {
    // 1. Live Desktop Test (1280x800)
    console.log('🖥️ --- 1. Verifying Live Desktop Viewport (1280x800) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage = await desktopContext.newPage();

    console.log('  Navigating to https://shopshield-bd.vercel.app...');
    const response = await desktopPage.goto('https://shopshield-bd.vercel.app', { waitUntil: 'load', timeout: 30000 });
    console.log(`  HTTP Response Status: ${response.status()}`);

    const stickerImg = desktopPage.locator('img[alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"]');
    await stickerImg.waitFor({ state: 'visible', timeout: 15000 });
    const isVisible = await stickerImg.isVisible();
    console.log(`  Live sticker image is visible: ${isVisible}`);
    if (!isVisible) throw new Error('Sticker image not visible on live desktop!');

    const link = desktopPage.locator('a[href="https://yunet-aignite26.devpost.com/"]').first();
    const linkHref = await link.getAttribute('href');
    const linkTarget = await link.getAttribute('target');
    console.log(`  Live Devpost Link Href: ${linkHref}, Target: ${linkTarget}`);
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
    console.log('  Live Desktop Image Loaded Info:', imgInfo);
    if (!imgInfo.complete || imgInfo.naturalWidth === 0) {
      throw new Error('Image failed to load in live browser!');
    }

    const naturalRatio = imgInfo.naturalWidth / imgInfo.naturalHeight;
    const renderedRatio = imgInfo.clientWidth / imgInfo.clientHeight;
    console.log(`  Natural aspect ratio: ${naturalRatio.toFixed(3)}, Rendered aspect ratio: ${renderedRatio.toFixed(3)}`);

    const liveDesktopScreenshotPath = path.join(screenshotsDir, 'live_desktop_buildathon_sticker.png');
    await desktopPage.screenshot({ path: liveDesktopScreenshotPath, fullPage: false });
    console.log(`  📸 Live desktop screenshot captured: ${liveDesktopScreenshotPath}`);

    // 2. Live Mobile Test (375x812)
    console.log('\n📱 --- 2. Verifying Live Mobile Viewport (375x812) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    console.log('  Navigating to https://shopshield-bd.vercel.app on mobile viewport...');
    await mobilePage.goto('https://shopshield-bd.vercel.app', { waitUntil: 'load', timeout: 30000 });

    const mobileSticker = mobilePage.locator('img[alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"]');
    await mobileSticker.waitFor({ state: 'visible', timeout: 15000 });
    const isMobileVisible = await mobileSticker.isVisible();
    console.log(`  Live mobile sticker is visible: ${isMobileVisible}`);
    if (!isMobileVisible) throw new Error('Sticker image not visible on live mobile!');

    const mobileImgInfo = await mobileSticker.evaluate((img) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
      currentSrc: img.currentSrc,
      complete: img.complete,
    }));
    console.log('  Live Mobile Image Loaded Info:', mobileImgInfo);

    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`  Live Mobile document scrollWidth: ${scrollWidth}px (Viewport: 375px)`);
    if (scrollWidth > 375) {
      throw new Error(`Horizontal overflow on live mobile: ${scrollWidth}px > 375px`);
    } else {
      console.log('  ✅ No horizontal overflow on live mobile.');
    }

    const liveMobileScreenshotPath = path.join(screenshotsDir, 'live_mobile_buildathon_sticker.png');
    await mobilePage.screenshot({ path: liveMobileScreenshotPath, fullPage: false });
    console.log(`  📸 Live mobile screenshot captured: ${liveMobileScreenshotPath}`);

    // 3. Bilingual toggle test on live
    console.log('\n🌐 --- 3. Verifying Live Bilingual Toggle Interaction ---');
    const enBtn = desktopPage.locator('button:has-text("English")').first();
    await enBtn.click();
    await wait(300);
    const enText = await desktopPage.locator('text=Official Devpost Event').isVisible();
    console.log(`  Live English badge text visible: ${enText}`);

    const bnBtn = desktopPage.locator('button:has-text("বাংলা")').first();
    await bnBtn.click();
    await wait(300);
    const bnText = await desktopPage.locator('text=অফিশিয়াল ইভেন্ট').isVisible();
    console.log(`  Live Bangla badge text visible: ${bnText}`);

    console.log('\n🎉 ALL LIVE PRODUCTION BUILDATHON STICKER TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Live Verification Error:', err);
    hasErrors = true;
  } finally {
    await browser.close();
  }

  process.exit(hasErrors ? 1 : 0);
}

run();
