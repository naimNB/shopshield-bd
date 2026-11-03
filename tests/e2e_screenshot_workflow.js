const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🚀 Starting ShopShield BD Real Browser Screenshot OCR & Workflow Test Suite...\n');

  const browser = await chromium.launch({ headless: true });
  let allPassed = true;

  const adImgPath = path.resolve('tests/fixtures/screenshots/ad_sample.png');
  const chatImgPath = path.resolve('tests/fixtures/screenshots/chat_sample.png');
  const ptImgPath = path.resolve('tests/fixtures/screenshots/transparency_sample.png');

  if (!fs.existsSync(adImgPath) || !fs.existsSync(chatImgPath) || !fs.existsSync(ptImgPath)) {
    console.error('❌ Test fixtures missing!');
    process.exit(1);
  }

  // TEST SUITE 1: Desktop (1280x800)
  console.log('🖥️ --- TEST SUITE 1: Desktop Browser (1280x800) ---');
  const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await contextDesktop.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('  [Browser Console Error]:', msg.text());
    }
  });

  try {
    // Navigate to homepage
    console.log('  1. Navigating to http://127.0.0.1:5173...');
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

    // Workflow 1: Ad Quick Check
    console.log('  2. Testing Workflow 1: Ad Quick Check Screenshot OCR...');
    const adCheckBtn = page.locator('button:has-text("বিজ্ঞাপন যাচাই")').first();
    await adCheckBtn.click();
    await page.waitForTimeout(500);

    // Find file input in Ad Quick Check view
    const adFileInput = page.locator('input[type="file"]').first();
    console.log('     Uploading ad_sample.png...');
    await adFileInput.setInputFiles(adImgPath);

    // Wait for OCR to finish and editable review textarea to appear
    console.log('     Waiting for AI OCR extraction...');
    const ocrReviewTextarea = page.locator('textarea[aria-label="OCR থেকে প্রাপ্ত টেক্সট সম্পাদনা করুন"]').first();
    await ocrReviewTextarea.waitFor({ state: 'visible', timeout: 30000 });
    const extractedAdText = await ocrReviewTextarea.inputValue();
    console.log(`     ✅ OCR Extracted (${extractedAdText.length} chars): "${extractedAdText.slice(0, 60)}..."`);

    // Edit the text slightly to verify editability
    const editedAdText = extractedAdText + '\n[অতিরিক্ত শর্ত: সাইজ না মিললে রিটার্ন ফ্রি]';
    await ocrReviewTextarea.fill(editedAdText);
    console.log('     Edited OCR text in review field.');

    // Click confirm button
    const confirmBtn = page.locator('button:has-text("কনফার্ম ও ইনপুটে যোগ করুন")').first();
    await confirmBtn.click();
    await page.waitForTimeout(500);

    // Verify main form textarea #ad-text-input contains the edited text
    const mainAdTextarea = page.locator('#ad-text-input');
    const mainAdValue = await mainAdTextarea.inputValue();
    if (!mainAdValue.includes('Export') && !mainAdValue.includes('Hoodies') && !mainAdValue.includes('অতিরিক্ত শর্ত')) {
      throw new Error(`Main form ad textarea did not receive confirmed text! Current: "${mainAdValue}"`);
    }
    console.log('     ✅ Main form ad textarea successfully populated with confirmed text!');

    // Trigger Ad Analysis
    console.log('     Clicking "বিজ্ঞাপন বিশ্লেষণ করুন"...');
    const analyzeAdBtn = page.locator('button:has-text("বিজ্ঞাপন বিশ্লেষণ করুন")').first();
    await analyzeAdBtn.click();

    // Verify Results Experience renders
    const resultsHeader = page.locator('text=সংক্ষেপে যা পাওয়া গেছে');
    await resultsHeader.waitFor({ state: 'visible', timeout: 35000 });
    console.log('     ✅ Ad Quick Check analysis results successfully rendered!');

    // Workflow 2: Ad vs Chat (Both Screenshot Slots)
    console.log('\n  3. Testing Workflow 2: Ad vs Chat Dual Screenshot OCR...');
    const adVsChatBtn = page.locator('button:has-text("বিজ্ঞাপন ও চ্যাট মিলিয়ে দেখুন")').first();
    await adVsChatBtn.click();
    await page.waitForTimeout(500);

    // Clear preset sample text by clicking "মুছুন"
    const clearBtn = page.locator('button:has-text("মুছুন")').first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(300);
    }

    // Slot 1: Ad Screenshot
    console.log('     Slot 1 (Ad): Uploading ad_sample.png...');
    const adSlotContainer = page.locator('#w2-ad-input').locator('xpath=..');
    const adSlotInput = adSlotContainer.locator('input[type="file"]');
    await adSlotInput.setInputFiles(adImgPath);

    const slot1Review = adSlotContainer.locator('textarea[aria-label="OCR থেকে প্রাপ্ত টেক্সট সম্পাদনা করুন"]');
    await slot1Review.waitFor({ state: 'visible', timeout: 30000 });
    const slot1Text = await slot1Review.inputValue();
    console.log(`     Slot 1 OCR Extracted: "${slot1Text.slice(0, 50)}..."`);

    const slot1Confirm = adSlotContainer.locator('button:has-text("কনফার্ম ও ইনপুটে যোগ করুন")');
    await slot1Confirm.click();
    await page.waitForTimeout(500);

    const w2AdVal = await page.locator('#w2-ad-input').inputValue();
    if (w2AdVal.length < 10) throw new Error('Slot 1 ad textarea was not populated!');
    console.log('     ✅ Slot 1 (Ad) populated successfully!');

    // Slot 2: Chat Screenshot
    console.log('     Slot 2 (Chat): Uploading chat_sample.png...');
    const chatSlotContainer = page.locator('#w2-chat-input').locator('xpath=..');
    const chatSlotInput = chatSlotContainer.locator('input[type="file"]');
    await chatSlotInput.setInputFiles(chatImgPath);

    const slot2Review = chatSlotContainer.locator('textarea[aria-label="OCR থেকে প্রাপ্ত টেক্সট সম্পাদনা করুন"]');
    await slot2Review.waitFor({ state: 'visible', timeout: 30000 });
    const slot2Text = await slot2Review.inputValue();
    console.log(`     Slot 2 OCR Extracted: "${slot2Text.slice(0, 50)}..."`);

    const slot2Confirm = chatSlotContainer.locator('button:has-text("কনফার্ম ও ইনপুটে যোগ করুন")');
    await slot2Confirm.click();
    await page.waitForTimeout(500);

    const w2ChatVal = await page.locator('#w2-chat-input').inputValue();
    if (w2ChatVal.length < 10) throw new Error('Slot 2 chat textarea was not populated!');
    console.log('     ✅ Slot 2 (Chat) populated successfully!');

    // Run Comparison Analysis
    console.log('     Clicking "প্রতিশ্রুতির গরমিল ও ঝুঁকি বিশ্লেষণ করুন"...');
    const compareBtn = page.locator('button:has-text("প্রতিশ্রুতির গরমিল ও ঝুঁকি বিশ্লেষণ করুন")').first();
    await compareBtn.click();

    // Verify comparison results
    const compResults = page.locator('h3:has-text("গরমিল")').first();
    await compResults.waitFor({ state: 'visible', timeout: 35000 });
    console.log('     ✅ Ad vs Chat comparison successfully executed and rendered!');

    // Workflow 3: Seller History (Page Transparency Screenshot)
    console.log('\n  4. Testing Workflow 3: Seller History Page Transparency Screenshot...');
    const sellerHistoryBtn = page.locator('button:has-text("বিক্রেতার ইতিহাস যাচাই")').first();
    await sellerHistoryBtn.click();
    await page.waitForTimeout(500);

    // Open Page Transparency section
    const transparencySummary = page.locator('summary:has-text("ফেসবুক পেজ ট্রান্সপারেন্সি")').first();
    await transparencySummary.click();
    await page.waitForTimeout(300);

    // Upload transparency screenshot
    const ptContainer = page.locator('details');
    const ptFileInput = ptContainer.locator('input[type="file"]');
    await ptFileInput.setInputFiles(ptImgPath);
    await page.waitForTimeout(500);

    // Click "বিশ্লেষণ করুন"
    console.log('     Clicking "বিশ্লেষণ করুন" on Page Transparency...');
    const ptAnalyzeBtn = ptContainer.locator('button:has-text("বিশ্লেষণ করুন")');
    await ptAnalyzeBtn.click();

    // Verify Page name extraction badge
    const ptBadge = page.locator('text=Dhaka Gadget Store').first();
    await ptBadge.waitFor({ state: 'visible', timeout: 30000 });
    console.log('     ✅ Page Transparency extracted and displayed successfully!');

  } catch (err) {
    console.error('❌ Desktop Test Failure:', err);
    allPassed = false;
  } finally {
    await contextDesktop.close();
  }

  // TEST SUITE 2: Mobile Viewport (375x667 - iPhone SE)
  console.log('\n📱 --- TEST SUITE 2: Mobile Browser (375x667) ---');
  const contextMobile = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true });
  const mobilePage = await contextMobile.newPage();

  try {
    console.log('  1. Navigating to http://127.0.0.1:5173 on Mobile...');
    await mobilePage.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`     Horizontal overflow check: ${hasHorizontalOverflow ? 'FAIL (overflowing)' : 'PASS (no overflow)'}`);
    if (hasHorizontalOverflow) {
      throw new Error('Mobile page has horizontal layout overflow!');
    }

    // Test Ad Quick Check upload on Mobile
    console.log('  2. Uploading ad screenshot on Mobile...');
    const adCheckBtnMobile = mobilePage.locator('button:has-text("বিজ্ঞাপন যাচাই")').first();
    await adCheckBtnMobile.click();
    await mobilePage.waitForTimeout(500);

    const mFileInput = mobilePage.locator('input[type="file"]').first();
    await mFileInput.setInputFiles(adImgPath);

    const mReview = mobilePage.locator('textarea[aria-label="OCR থেকে প্রাপ্ত টেক্সট সম্পাদনা করুন"]').first();
    await mReview.waitFor({ state: 'visible', timeout: 30000 });
    console.log('     ✅ Mobile OCR Review field visible!');

    const mConfirm = mobilePage.locator('button:has-text("কনফার্ম ও ইনপুটে যোগ করুন")').first();
    await mConfirm.click();
    await mobilePage.waitForTimeout(500);

    const mAdVal = await mobilePage.locator('#ad-text-input').inputValue();
    if (mAdVal.length < 10) throw new Error('Mobile form was not populated!');
    console.log('     ✅ Mobile form input populated successfully!');

  } catch (err) {
    console.error('❌ Mobile Test Failure:', err);
    allPassed = false;
  } finally {
    await contextMobile.close();
    await browser.close();
  }

  if (allPassed) {
    console.log('\n🎉 ALL REAL BROWSER TESTS PASSED 100%!');
    process.exit(0);
  } else {
    console.error('\n❌ SOME BROWSER TESTS FAILED!');
    process.exit(1);
  }
}

runTests();
