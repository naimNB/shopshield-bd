const path = require('path');
const { chromium } = require(path.resolve('frontend/node_modules/playwright'));
const fs = require('fs');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('🌐 Starting Comprehensive Live Production Verification on Vercel...\n');
  console.log('  Frontend: https://shopshield-bd.vercel.app');
  console.log('  Backend:  https://shopshield-bd-api.vercel.app\n');

  const screenshotsDir = path.resolve('artifacts/screenshots/production_task21');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  let hasErrors = false;

  try {
    // 0. Verify Backend API Health
    console.log('🏥 --- Step 0: Checking Backend API Health ---');
    const apiContext = await browser.newContext();
    const apiPage = await apiContext.newPage();
    const healthResp = await apiPage.goto('https://shopshield-bd-api.vercel.app/health', {
      waitUntil: 'load',
      timeout: 30000,
    });
    console.log(`  Backend /health status: ${healthResp.status()}`);
    if (healthResp.status() !== 200) {
      throw new Error(`Backend /health returned HTTP ${healthResp.status()}`);
    }
    const healthJson = await healthResp.json();
    console.log('  Backend /health response:', healthJson);
    await apiContext.close();

    // 1. Verify Desktop Production (1280x800)
    console.log('\n🖥️ --- Step 1: Checking Live Desktop Production (1280x800) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage = await desktopContext.newPage();

    // Track console errors
    const consoleErrors = [];
    desktopPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('  Navigating to https://shopshield-bd.vercel.app...');
    const response = await desktopPage.goto('https://shopshield-bd.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    console.log(`  HTTP Response Status: ${response.status()}`);
    if (response.status() !== 200) {
      throw new Error(`Frontend returned HTTP ${response.status()}`);
    }

    // 1a. Buildathon Sticker & Devpost Link
    console.log('\n  [1a] Verifying Official Buildathon Sticker...');
    const stickerImg = desktopPage.locator('img[alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"]');
    await stickerImg.waitFor({ state: 'visible', timeout: 15000 });
    const isStickerVisible = await stickerImg.isVisible();
    console.log(`    Sticker visible: ${isStickerVisible}`);
    if (!isStickerVisible) throw new Error('Sticker is not visible!');

    const link = desktopPage.locator('a[href="https://yunet-aignite26.devpost.com/"]').first();
    const linkHref = await link.getAttribute('href');
    const linkTarget = await link.getAttribute('target');
    console.log(`    Devpost link: ${linkHref} (target: ${linkTarget})`);
    if (linkHref !== 'https://yunet-aignite26.devpost.com/' || linkTarget !== '_blank') {
      throw new Error(`Unexpected Devpost link attributes: ${linkHref}`);
    }

    const imgInfo = await stickerImg.evaluate((img) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
      complete: img.complete,
      currentSrc: img.currentSrc,
    }));
    console.log('    Sticker image dimensions:', imgInfo);
    if (!imgInfo.complete || imgInfo.naturalWidth === 0) {
      throw new Error('Sticker failed to render image bytes!');
    }

    // 1b. Footer Developer Name
    console.log('\n  [1b] Verifying Footer Developer Name...');
    const footer = desktopPage.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await wait(300);
    const footerText = await footer.innerText();
    console.log('    Footer snippet:', footerText.split('\n').filter(Boolean).slice(-3).join(' | '));
    if (!footerText.includes('Developed by Md. Naim for YUNet AIgnite Buildathon 2026.')) {
      throw new Error(
        `Footer does not contain required text 'Developed by Md. Naim for YUNet AIgnite Buildathon 2026.'. Found: ${footerText}`
      );
    }
    console.log('    ✅ Footer developer name "Md. Naim" verified successfully.');

    // 1c. Bilingual Toggle & Translations
    console.log('\n  [1c] Testing Bilingual Toggle & Translations...');
    // Toggle to English
    const enBtn = desktopPage.locator('button:has-text("English")').first();
    await enBtn.click();
    await wait(500);

    const langAttrEn = await desktopPage.locator('html').getAttribute('lang');
    console.log(`    HTML lang attribute: ${langAttrEn}`);
    if (langAttrEn !== 'en') throw new Error(`Expected html lang="en", got "${langAttrEn}"`);

    // Check How It Works step badges in English (must be 1, 2, 3)
    const enStepBadges = await desktopPage.locator('section#how-it-works div.font-mono').allInnerTexts();
    console.log('    English How It Works badges:', enStepBadges);
    if (!enStepBadges.includes('1') || !enStepBadges.includes('2') || !enStepBadges.includes('3')) {
      throw new Error(`English badges expected ['1', '2', '3'], got: ${JSON.stringify(enStepBadges)}`);
    }

    // Check About section English text
    const aboutSectionTextEn = await desktopPage.locator('section#about').innerText();
    if (!aboutSectionTextEn.includes('Uploaded screenshots and chat content are processed without permanent storage')) {
      throw new Error('About section English translation missing expected privacy description!');
    }
    console.log('    ✅ English About section privacy translation verified.');

    // Toggle back to Bangla
    const bnBtn = desktopPage.locator('button:has-text("বাংলা")').first();
    await bnBtn.click();
    await wait(500);

    const langAttrBn = await desktopPage.locator('html').getAttribute('lang');
    console.log(`    HTML lang attribute: ${langAttrBn}`);
    if (langAttrBn !== 'bn') throw new Error(`Expected html lang="bn", got "${langAttrBn}"`);

    const bnStepBadges = await desktopPage.locator('section#how-it-works div.font-mono').allInnerTexts();
    console.log('    Bangla How It Works badges:', bnStepBadges);
    if (!bnStepBadges.includes('১') || !bnStepBadges.includes('২') || !bnStepBadges.includes('৩')) {
      throw new Error(`Bangla badges expected ['১', '২', '৩'], got: ${JSON.stringify(bnStepBadges)}`);
    }
    console.log('    ✅ Bangla How It Works badges verified.');

    // Capture Desktop Screenshot
    const desktopScreenshot = path.join(screenshotsDir, 'live_desktop_home.png');
    await desktopPage.screenshot({ path: desktopScreenshot, fullPage: true });
    console.log(`    📸 Full desktop screenshot captured: ${desktopScreenshot}`);

    // 1d. Tab Switching and Workflows
    console.log('\n  [1d] Testing Verification Hub Tabs...');
    // Tab 1: Ad Quick Check
    const tab1Btn = desktopPage.locator('#tab-ad-check');
    await tab1Btn.click();
    await wait(300);
    const tab1Panel = desktopPage.locator('#tabpanel-ad-check');
    const isTab1Visible = await tab1Panel.isVisible();
    console.log(`    Tab 1 (Ad Quick Check) panel visible: ${isTab1Visible}`);
    if (!isTab1Visible) throw new Error('Ad Quick Check panel not visible!');

    // Tab 2: Ad vs Chat Contradiction
    const tab2Btn = desktopPage.locator('#tab-ad-vs-chat');
    await tab2Btn.click();
    await wait(300);
    const tab2Panel = desktopPage.locator('#tabpanel-ad-vs-chat');
    const isTab2Visible = await tab2Panel.isVisible();
    console.log(`    Tab 2 (Ad vs Chat) panel visible: ${isTab2Visible}`);
    if (!isTab2Visible) throw new Error('Ad vs Chat panel not visible after tab click!');

    // Tab 3: Seller History Intelligence
    const tab3Btn = desktopPage.locator('#tab-seller-history');
    await tab3Btn.click();
    await wait(300);
    const tab3Panel = desktopPage.locator('#tabpanel-seller-history');
    const isTab3Visible = await tab3Panel.isVisible();
    console.log(`    Tab 3 (Seller History) panel visible: ${isTab3Visible}`);
    if (!isTab3Visible) throw new Error('Seller History panel not visible after tab click!');

    // Switch back to Tab 1
    await tab1Btn.click();
    await wait(300);

    // 2. Mobile Production (375x812)
    console.log('\n📱 --- Step 2: Checking Live Mobile Production (375x812) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    console.log('  Navigating to https://shopshield-bd.vercel.app on mobile...');
    const mobResponse = await mobilePage.goto('https://shopshield-bd.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    console.log(`  Mobile HTTP status: ${mobResponse.status()}`);
    if (mobResponse.status() !== 200) {
      throw new Error(`Mobile returned HTTP ${mobResponse.status()}`);
    }

    const mobileSticker = mobilePage.locator('img[alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"]');
    const isMobileStickerVisible = await mobileSticker.isVisible();
    console.log(`  Mobile sticker visible: ${isMobileStickerVisible}`);
    if (!isMobileStickerVisible) throw new Error('Mobile sticker is not visible!');

    // Check horizontal scroll width
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`  Mobile document scrollWidth: ${scrollWidth}px (Viewport: 375px)`);
    if (scrollWidth > 375) {
      throw new Error(`Mobile horizontal overflow detected: ${scrollWidth}px > 375px`);
    }
    console.log('  ✅ Zero horizontal overflow on 375px mobile.');

    // Check footer on mobile
    const mobFooter = mobilePage.locator('footer');
    await mobFooter.scrollIntoViewIfNeeded();
    await wait(300);
    const mobFooterText = await mobFooter.innerText();
    if (!mobFooterText.includes('Developed by Md. Naim for YUNet AIgnite Buildathon 2026.')) {
      throw new Error('Mobile footer missing required developer credit!');
    }
    console.log('  ✅ Mobile footer developer credit verified.');

    const mobileScreenshot = path.join(screenshotsDir, 'live_mobile_home.png');
    await mobilePage.screenshot({ path: mobileScreenshot, fullPage: true });
    console.log(`  📸 Full mobile screenshot captured: ${mobileScreenshot}`);

    // Check console errors
    console.log('\n🛡️ --- Step 3: Checking Console Logs & Errors ---');
    console.log(`  Total console error messages captured: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('  ⚠️ Console errors noted:', consoleErrors);
    } else {
      console.log('  ✅ Zero console errors encountered on live production.');
    }

    console.log('\n🎉 ALL LIVE PRODUCTION SMOKE TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Production Verification Error:', err);
    hasErrors = true;
  } finally {
    await browser.close();
  }

  process.exit(hasErrors ? 1 : 0);
}

run();
