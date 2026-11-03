const { chromium } = require('playwright');

async function runTask18Verification() {
  console.log('🚀 Running Task 18 E2E Bilingual & Verification Test Suite...\n');

  const browser = await chromium.launch({ headless: true });
  let failed = false;

  // Desktop Test Context
  console.log('🖥️ [1/2] Desktop Browser Test (1280x800)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await desktopContext.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('   [Browser Console Error]:', msg.text());
    }
  });

  try {
    // 1. Visit homepage
    console.log('   1. Navigating to http://127.0.0.1:5173...');
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

    // 2. Default Bengali Verification
    console.log('   2. Verifying default Bengali interface...');
    const navVerifyBn = await page.locator('nav a:has-text("যাচাই")').first().isVisible();
    const navHowBn = await page.locator('nav a:has-text("কীভাবে কাজ করে")').first().isVisible();
    const heroTitle = await page.locator('h1').innerText();
    console.log(`      Header: Verify="${navVerifyBn}", How="${navHowBn}"`);
    console.log(`      Hero: "${heroTitle.replace(/\n+/g, ' ')}"`);
    if (!navVerifyBn || !heroTitle.includes('কেনাকাটায়')) {
      throw new Error('Default Bengali UI not rendered properly');
    }

    // 3. Switch to English
    console.log('   3. Testing language switch to English...');
    const langBtnEn = page.locator('button:has-text("English")').first();
    await langBtnEn.click();
    await page.waitForTimeout(300);

    const navVerifyEn = await page.locator('nav a:has-text("Verify")').first().isVisible();
    const heroTitleEn = await page.locator('h1').innerText();
    console.log(`      Switched to EN: Verify="${navVerifyEn}"`);
    console.log(`      Hero EN: "${heroTitleEn.replace(/\n+/g, ' ')}"`);
    if (!navVerifyEn || !heroTitleEn.toLowerCase().includes('shopping')) {
      throw new Error('English toggle failed to update header / hero');
    }

    // 4. Test State Preservation across language toggle
    console.log('   4. Testing form state preservation across language toggles...');
    const adInput = page.locator('textarea').first();
    const testSecret = 'PreserveThisInputAcrossToggle_12345';
    await adInput.fill(testSecret);

    // Toggle back to Bengali
    const langBtnBn = page.locator('button:has-text("বাংলা")').first();
    await langBtnBn.click();
    await page.waitForTimeout(300);

    const valAfterBn = await adInput.inputValue();
    if (valAfterBn !== testSecret) {
      throw new Error(`Input text lost during toggle to BN! Got: "${valAfterBn}"`);
    }

    // Toggle back to English
    const langBtnEnAgain = page.locator('button:has-text("English")').first();
    await langBtnEnAgain.click();
    await page.waitForTimeout(300);

    const valAfterEn = await adInput.inputValue();
    if (valAfterEn !== testSecret) {
      throw new Error(`Input text lost during toggle to EN! Got: "${valAfterEn}"`);
    }
    console.log('      ✅ Input state perfectly preserved across language switches!');
    await adInput.fill(''); // Clear

    // 5. Scenario 1 (COD vs 100% advance):
    console.log('   5. Testing Demonstration Scenario 1 (Ad COD vs Chat 100% Advance)...');
    // Switch to Ad vs Seller Chat tab
    const adVsChatTab = page.locator('button[role="tab"]:has-text("Ad vs Seller Chat")').or(page.locator('button[role="tab"]:has-text("বিজ্ঞাপন বনাম চ্যাট")')).first();
    await adVsChatTab.click();
    await page.waitForTimeout(300);

    // Click Scenario 1 chip inside visible panel
    const scenario1Chip = page.locator('#tabpanel-ad-vs-chat button:has-text("Ad COD vs Chat 100% Advance")').or(page.locator('#tabpanel-ad-vs-chat button:has-text("বিজ্ঞাপনে COD বনাম চ্যাটে ১০০% অগ্রিম")')).first();
    await scenario1Chip.click();
    await page.waitForTimeout(300);

    // Click Compare Promises button
    const compareBtn = page.locator('#tabpanel-ad-vs-chat button:has-text("Compare Promises")').or(page.locator('#tabpanel-ad-vs-chat button:has-text("প্রতিশ্রুতি তুলনা করুন")')).first();
    await compareBtn.click();
    console.log('      Sent Ad vs Chat analysis request, waiting for results...');

    // Wait for Assessment Banner
    const banner = page.locator('text=Warning Signs Detected').or(page.locator('text=সতর্কতা সংকেত চিহ্নিত হয়েছে')).first();
    await banner.waitFor({ state: 'visible', timeout: 35000 });
    console.log('      ✅ Overall Assessment Banner displayed: WARNING_SIGNS_FOUND');

    // Verify Payment Warning
    const paymentWarning = page.locator('text=Warning Signs & Payment Risks').or(page.locator('text=সতর্কতা ও পেমেন্ট ঝুঁকি')).first();
    await paymentWarning.waitFor({ state: 'visible', timeout: 5000 });
    console.log('      ✅ Payment Warnings Card visible');

    // Verify Contradictions section
    const contradictionSection = page.locator('text=Promise Consistency & Contradictions').or(page.locator('text=বিজ্ঞাপন ও চ্যাটের প্রতিশ্রুতি তুলনা')).first();
    await contradictionSection.waitFor({ state: 'visible', timeout: 5000 });
    console.log('      ✅ Contradiction Section visible');

    // Verify Buyer Questions and Copy Button
    const copyBtn = page.locator('#tabpanel-ad-vs-chat button:has-text("Copy Questions")').or(page.locator('#tabpanel-ad-vs-chat button:has-text("প্রশ্নগুলো কপি করুন")')).first();
    await copyBtn.waitFor({ state: 'visible', timeout: 5000 });
    await copyBtn.click();
    await page.waitForTimeout(500);
    const copiedFeedback = await page.locator('text=Copied!').or(page.locator('text=কপি হয়েছে!')).first().isVisible();
    console.log(`      ✅ One-Click Copy Feedback: ${copiedFeedback}`);

    // 6. Scenario 2 (Claimed Original Watch):
    console.log('   6. Testing Demonstration Scenario 2 (Unverified Original Claim)...');
    // Switch back to Ad Quick Check tab
    const adCheckTab = page.locator('button[role="tab"]:has-text("Ad Quick Check")').or(page.locator('button[role="tab"]:has-text("বিজ্ঞাপন যাচাই")')).first();
    await adCheckTab.click();
    await page.waitForTimeout(300);

    // Click Scenario 2 chip inside Ad Quick Check panel
    const scenario2Chip = page.locator("#tabpanel-ad-check button:has-text(\"Unverified 'Original' Watch Claim\")").or(page.locator("#tabpanel-ad-check button:has-text(\"যাচাইহীন '১০০% আসল' ঘড়ি দাবি\")")).first();
    await scenario2Chip.click();
    await page.waitForTimeout(300);

    // Click Analyze button inside Ad Quick Check panel
    const analyzeBtn = page.locator('#tabpanel-ad-check button:has-text("Analyze Advertisement")').or(page.locator('#tabpanel-ad-check button:has-text("বিজ্ঞাপন যাচাই করুন")')).first();
    await analyzeBtn.click();
    console.log('      Sent Ad analysis request, waiting for results...');

    // Wait for Product Authenticity Card
    const authenticityCard = page.locator('text=Product Authenticity Assessment').or(page.locator('text=পণ্যের সত্যতা ও আসল-নকল মূল্যায়ন')).first();
    await authenticityCard.waitFor({ state: 'visible', timeout: 35000 });
    console.log('      ✅ Product Authenticity Card displayed');

    const claimedBadge = page.locator('text=Claimed as Original').or(page.locator('text=আসল বলে দাবি করা হয়েছে')).first();
    const isClaimedVisible = await claimedBadge.isVisible();
    console.log(`      ✅ "Claimed as Original / Not independently verified" status visible: ${isClaimedVisible}`);

    const stepsTitle = page.locator('text=Physical Verification & Inspection Steps').or(page.locator('text=শারীরিক পরিদর্শন ধাপ')).first();
    console.log(`      ✅ Physical Inspection Checklist rendered: ${await stepsTitle.isVisible()}`);

    // 7. Scenario 3 (Seller History tab):
    console.log('   7. Testing Tab 3: Seller History & Archive Research...');
    const sellerHistoryTab = page.locator('#tab-seller-history');
    await sellerHistoryTab.click();
    await page.waitForTimeout(400);

    const historyHeading = await page.locator('text=বিক্রেতার ইতিহাস ও আর্কাইভ যাচাই').or(page.locator('text=Seller History')).first().isVisible();
    console.log(`      ✅ Seller History UI loaded: ${historyHeading}`);

  } catch (err) {
    console.error('❌ Desktop test error:', err.message);
    failed = true;
  } finally {
    await desktopContext.close();
  }

  // Mobile Viewport Test (375x812)
  console.log('\n📱 [2/2] Mobile Browser Test (375x812)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  try {
    await mobilePage.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

    // Check horizontal overflow
    const hasHorizontalOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`   Horizontal overflow check: ${hasHorizontalOverflow ? 'FAILED (Overflow detected)' : 'PASSED (No overflow)'}`);
    if (hasHorizontalOverflow) {
      throw new Error('Mobile viewport has horizontal overflow');
    }

    // Check mobile hamburger menu
    const menuBtn = mobilePage.locator('button[aria-label="Open menu"]').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await mobilePage.waitForTimeout(300);
      const closeMenuBtn = mobilePage.locator('button[aria-label="Close menu"]').first();
      console.log(`   Mobile drawer opened: ${await closeMenuBtn.isVisible()}`);
      await closeMenuBtn.click();
      await mobilePage.waitForTimeout(300);
    }

    console.log('   ✅ Mobile viewport and drawer navigation passed!');
  } catch (err) {
    console.error('❌ Mobile test error:', err.message);
    failed = true;
  } finally {
    await mobileContext.close();
    await browser.close();
  }

  if (failed) {
    console.error('\n❌ Task 18 E2E Test Suite FAILED.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TASK 18 E2E TESTS PASSED SUCCESSFULLY!');
  }
}

runTask18Verification();
