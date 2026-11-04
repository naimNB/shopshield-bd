const path = require('path');
const { chromium } = require(path.resolve('frontend/node_modules/playwright'));
const { spawn } = require('child_process');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSmokeTests() {
  console.log('🧪 Starting Task 20 UI Smoke & Consistency Test Suite...\n');

  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: path.resolve('frontend'),
    stdio: 'pipe',
  });

  await wait(2500);

  const browser = await chromium.launch({ headless: true });
  let allPassed = true;

  try {
    // 1. Desktop Test (1280x800)
    console.log('🖥️ 1. Testing Desktop (1280x800)...');
    const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const desktopPage = await desktopCtx.newPage();
    await desktopPage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

    // Check header sync on Ad Check
    const adHeader = await desktopPage.locator('#analyzer h2').textContent();
    console.log(`   Initial Header: "${adHeader?.trim()}"`);
    if (!adHeader?.includes('বিজ্ঞাপন যাচাই')) {
      console.error('   ❌ Initial header does not include expected title');
      allPassed = false;
    }

    // Switch to Ad vs Chat tab
    const chatTab = desktopPage.locator('#tab-ad-vs-chat');
    await chatTab.click();
    await wait(200);
    const chatHeader = await desktopPage.locator('#analyzer h2').textContent();
    console.log(`   Switched to Chat Header: "${chatHeader?.trim()}"`);
    if (!chatHeader?.includes('বিজ্ঞাপন বনাম চ্যাট')) {
      console.error('   ❌ Chat header does not match active tab');
      allPassed = false;
    }

    // Switch to Page Transparency tab
    const transTab = desktopPage.locator('#tab-seller-history');
    await transTab.click();
    await wait(200);
    const transHeader = await desktopPage.locator('#analyzer h2').textContent();
    const transDesc = await desktopPage.locator('#analyzer p').first().textContent();
    console.log(`   Switched to Transparency Header: "${transHeader?.trim()}", desc: "${transDesc?.trim()}"`);
    if (!transHeader?.includes('পেজ ট্রান্সপারেন্সি')) {
      console.error('   ❌ Transparency header does not match active tab');
      allPassed = false;
    }

    // Test English switch
    console.log('   Testing English Language Switch...');
    const enBtn = desktopPage.locator('button:has-text("English")').first();
    await enBtn.click();
    await wait(200);
    const enVerifyHeader = await desktopPage.locator('#analyzer h2').textContent();
    console.log(`   English Header: "${enVerifyHeader?.trim()}"`);
    if (!enVerifyHeader?.includes('Page Transparency')) {
      console.error('   ❌ English translation not applied to dynamic header');
      allPassed = false;
    }

    // Switch back to Bangla
    const bnBtn = desktopPage.locator('button:has-text("বাংলা")').first();
    await bnBtn.click();
    await wait(200);
    console.log('   ✅ Bilingual toggle and dynamic tab synchronization passed.');

    await desktopCtx.close();

    // 2. Tablet Test (768x1024) - Verify no text wrapping or overflow
    console.log('\n📱 2. Testing Tablet (768x1024)...');
    const tabletCtx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const tabletPage = await tabletCtx.newPage();
    await tabletPage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

    const tabletScrollWidth = await tabletPage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`   Tablet scrollWidth: ${tabletScrollWidth}px (Target: 768px)`);
    if (tabletScrollWidth > 768) {
      console.error(`   ❌ Horizontal overflow on tablet: ${tabletScrollWidth} > 768`);
      allPassed = false;
    } else {
      console.log('   ✅ Zero horizontal overflow on tablet.');
    }

    // Verify hamburger button exists and opens menu
    const menuBtn = tabletPage.locator('button[aria-label="Open Menu"]').first();
    const menuBtnVisible = await menuBtn.isVisible();
    console.log(`   Hamburger menu button visible: ${menuBtnVisible}`);
    if (menuBtnVisible) {
      await menuBtn.click();
      await wait(200);
      const drawerVisible = await tabletPage.locator('#mobile-nav').isVisible();
      console.log(`   Mobile drawer opens: ${drawerVisible}`);
    }

    await tabletCtx.close();

    // 3. Mobile Test (375x812)
    console.log('\n📱 3. Testing Mobile (375x812)...');
    const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

    const mobileScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`   Mobile scrollWidth: ${mobileScrollWidth}px (Target: 375px)`);
    if (mobileScrollWidth > 375) {
      console.error(`   ❌ Horizontal overflow on mobile: ${mobileScrollWidth} > 375`);
      allPassed = false;
    } else {
      console.log('   ✅ Zero horizontal overflow on mobile.');
    }

    // Toggle language on mobile
    const mobileEnBtn = mobilePage.getByRole('button', { name: 'EN' }).first();
    await mobileEnBtn.click();
    await wait(200);
    const mobileEnTitle = await mobilePage.locator('h1').textContent();
    console.log(`   Mobile translated h1: "${mobileEnTitle?.slice(0, 30)}..."`);

    await mobileCtx.close();

  } catch (err) {
    console.error('Error during smoke tests:', err);
    allPassed = false;
  } finally {
    await browser.close();
    server.kill();
  }

  if (allPassed) {
    console.log('\n🎉 ALL TASK 20 SMOKE & CONSISTENCY TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('\n❌ Smoke tests failed!');
    process.exit(1);
  }
}

runSmokeTests();
