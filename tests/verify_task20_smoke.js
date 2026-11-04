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
    await wait(250);

    // 1. Verify dynamic verify header
    const enVerifyHeader = await desktopPage.locator('#analyzer h2').textContent();
    console.log(`   English Header: "${enVerifyHeader?.trim()}"`);
    if (!enVerifyHeader?.includes('Page Transparency')) {
      console.error('   ❌ English translation not applied to dynamic header');
      allPassed = false;
    }

    // 2. Verify How It Works step numbers in English mode (1, 2, 3)
    const stepBadges = await desktopPage.locator('#how-it-works div.font-mono').allTextContents();
    console.log(`   English How It Works numbers: ${JSON.stringify(stepBadges)}`);
    if (!stepBadges.includes('1') || !stepBadges.includes('2') || !stepBadges.includes('3')) {
      console.error('   ❌ How It Works step badges are not 1, 2, 3 in English mode');
      allPassed = false;
    }
    if (stepBadges.includes('১') || stepBadges.includes('২') || stepBadges.includes('৩')) {
      console.error('   ❌ Lingering Bengali digits in How It Works step badges in English mode');
      allPassed = false;
    }

    // 3. Verify About Section privacy & open-source descriptions in English mode
    const aboutText = await desktopPage.locator('#about').textContent();
    if (!aboutText.includes('Uploaded screenshots and chat content are processed without permanent storage')) {
      console.error('   ❌ About section does not contain English privacy description');
      allPassed = false;
    }
    if (aboutText.includes('আপনার আপলোড করা স্ক্রিনশট বা চ্যাট সার্ভারে স্থায়ীভাবে')) {
      console.error('   ❌ Lingering Bengali privacy description in English mode');
      allPassed = false;
    }
    if (!aboutText.includes('An open-source technology initiative designed to help online and social-commerce buyers')) {
      console.error('   ❌ About section does not contain English open-source description');
      allPassed = false;
    }
    if (aboutText.includes('অনলাইন ও সোশ্যাল কমার্সে সাধারণ ক্রেতাদের আর্থিক নিরাপত্তা')) {
      console.error('   ❌ Lingering Bengali open-source description in English mode');
      allPassed = false;
    }

    // 4. Verify Footer headings in English mode
    const footerText = await desktopPage.locator('footer').textContent();
    if (!footerText.includes('Developer API') || !footerText.includes('Hackathon Information')) {
      console.error('   ❌ Footer does not contain English headings "Developer API" & "Hackathon Information"');
      allPassed = false;
    }
    if (footerText.includes('ডেভেলপার এপিআই') || footerText.includes('হ্যাকাতন তথ্য')) {
      console.error('   ❌ Lingering Bengali footer headings in English mode');
      allPassed = false;
    }

    // 5. Verify Scenario 3 button title in English mode
    const adTab = desktopPage.locator('#tab-ad-check');
    await adTab.click();
    await wait(200);
    const scenario3Btn = desktopPage.locator('button:has-text("Clear Advertised Terms")').first();
    const isScenario3Visible = await scenario3Btn.isVisible();
    console.log(`   Scenario 3 button "Clear Advertised Terms" visible: ${isScenario3Visible}`);
    if (!isScenario3Visible) {
      console.error('   ❌ Scenario 3 button with text "Clear Advertised Terms" not found');
      allPassed = false;
    }

    // 6. Verify data isolation upon language toggle
    const testInputText = 'Sample Winter Jacket Price 1500 Tk Cash on delivery';
    await desktopPage.locator('#ad-text-input').fill(testInputText);
    const bnBtnToggle = desktopPage.locator('button:has-text("বাংলা")').first();
    await bnBtnToggle.click();
    await wait(200);
    const textAfterBnToggle = await desktopPage.locator('#ad-text-input').inputValue();
    if (textAfterBnToggle !== testInputText) {
      console.error('   ❌ Input text was lost or mutated after toggling to Bengali');
      allPassed = false;
    } else {
      console.log('   ✅ Input text preserved when switching to Bengali.');
    }

    // Check Bengali How It Works step badges (১, ২, ৩)
    const bnStepBadges = await desktopPage.locator('#how-it-works div.font-mono').allTextContents();
    console.log(`   Bengali How It Works numbers: ${JSON.stringify(bnStepBadges)}`);
    if (!bnStepBadges.includes('১') || !bnStepBadges.includes('২') || !bnStepBadges.includes('৩')) {
      console.error('   ❌ How It Works step badges are not ১, ২, ৩ in Bengali mode');
      allPassed = false;
    }

    // Switch back to English and check input preservation again
    await enBtn.click();
    await wait(200);
    const textAfterEnToggle = await desktopPage.locator('#ad-text-input').inputValue();
    if (textAfterEnToggle !== testInputText) {
      console.error('   ❌ Input text was lost or mutated after toggling back to English');
      allPassed = false;
    } else {
      console.log('   ✅ Input text preserved when switching back to English.');
    }

    // Switch back to Bangla as default
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
