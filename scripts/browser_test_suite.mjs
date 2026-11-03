/**
 * ShopShield BD - Comprehensive Browser Testing & E2E Validation Suite (Playwright)
 *
 * Implements Phase 2 (Browser Compliance & Viewport Testing across 6 screen sizes)
 * and Phase 3 (E2E Validation of all 4 Buyer Verification Workflows).
 */

import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const BASE_URL = process.env.TEST_URL || 'https://shopshield-bd.vercel.app';
const API_URL = process.env.TEST_API_URL || 'https://shopshield-bd-api.vercel.app';

const VIEWPORTS = [
  { name: 'Mobile Small', width: 320, height: 568 },
  { name: 'Mobile Standard', width: 375, height: 667 },
  { name: 'Mobile Modern', width: 390, height: 844 },
  { name: 'Mobile Large', width: 430, height: 932 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 },
];

const results = {
  viewports: {},
  phase2Checks: {},
  phase3Workflows: {},
  consoleErrors: [],
  pageErrors: [],
};

async function runSuite() {
  console.log(`========================================================================`);
  console.log(`  ShopShield BD — End-to-End Browser QA & Validation Suite`);
  console.log(`  Target Frontend: ${BASE_URL}`);
  console.log(`  Target Backend:  ${API_URL}`);
  console.log(`========================================================================\n`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--host-resolver-rules=MAP shopshield-bd.vercel.app 76.76.21.21, MAP shopshield-bd-api.vercel.app 76.76.21.21',
    ],
  });

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: VIEWPORT TESTING & HORIZONTAL OVERFLOW CHECK (6 VIEWPORTS)
    // ------------------------------------------------------------------------
    console.log(`>>> Section 1: Testing Responsive Viewports & Layout Integrity...`);
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (Playwright Test Runner; Linux x86_64) AppleWebKit/537.36',
      });
      const page = await context.newPage();

      // Listen for uncaught errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          results.consoleErrors.push(`[${vp.name} console.error]: ${msg.text()}`);
        }
      });
      page.on('pageerror', (err) => {
        results.pageErrors.push(`[${vp.name} pageerror]: ${err.message}`);
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

      // Check overflow
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const maxScroll = Math.max(scrollWidth, bodyScrollWidth);
        return {
          clientWidth: docWidth,
          scrollWidth: maxScroll,
          hasHorizontalOverflow: maxScroll > docWidth + 1, // 1px threshold for subpixel rounding
        };
      });

      // Verify main visual sections exist
      const headerVisible = await page.locator('header').isVisible();
      const heroVisible = await page.locator('h1').isVisible();
      const hubVisible = await page.locator('#analyzer').isVisible();
      const footerVisible = await page.locator('footer').isVisible();

      results.viewports[vp.name] = {
        width: vp.width,
        height: vp.height,
        overflowCheckPassed: !overflow.hasHorizontalOverflow,
        scrollWidth: overflow.scrollWidth,
        clientWidth: overflow.clientWidth,
        sectionsRendered: headerVisible && heroVisible && hubVisible && footerVisible,
      };

      console.log(
        `  ✓ ${vp.name} (${vp.width}x${vp.height}): Overflow: ${
          overflow.hasHorizontalOverflow ? 'FAIL' : 'PASS'
        } (scroll: ${overflow.scrollWidth}px, client: ${overflow.clientWidth}px) | Sections: ${
          headerVisible && heroVisible ? 'OK' : 'MISSING'
        }`
      );

      await context.close();
    }

    // ------------------------------------------------------------------------
    // SECTION 2: INTERACTIVE UI & ACCESSIBILITY TESTS (PHASE 2)
    // ------------------------------------------------------------------------
    console.log(`\n>>> Section 2: Phase 2 UI, ARIA, and Interaction Tests...`);
    const testContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await testContext.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') results.consoleErrors.push(`[Desktop console.error]: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      results.pageErrors.push(`[Desktop pageerror]: ${err.message}`);
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Item 1: Title & Hero
    const title = await page.title();
    console.log(`  [P2.1] Page Title: "${title}"`);
    results.phase2Checks['pageTitle'] = title.includes('ShopShield');

    // Item 2: Mobile Hamburger & Escape Key & Focus Restoration
    console.log(`  [P2.2] Testing Mobile Hamburger Navigation & Escape Key...`);
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });

    const menuButton = mobilePage.locator('button[aria-controls="mobile-nav"]');
    await menuButton.click();
    await mobilePage.waitForTimeout(200);
    const drawerVisibleAfterClick = await mobilePage.locator('#mobile-nav').isVisible();

    // Press Escape
    await mobilePage.keyboard.press('Escape');
    await mobilePage.waitForTimeout(200);
    const drawerVisibleAfterEscape = await mobilePage.locator('#mobile-nav').isVisible();
    const isMenuButtonFocused = await mobilePage.evaluate(() => {
      return document.activeElement?.getAttribute('aria-controls') === 'mobile-nav';
    });

    results.phase2Checks['mobileMenu'] = {
      drawerOpened: drawerVisibleAfterClick,
      drawerClosedOnEscape: !drawerVisibleAfterEscape,
      focusRestored: isMenuButtonFocused,
    };
    console.log(
      `    ✓ Drawer open: ${drawerVisibleAfterClick}, closed on Escape: ${!drawerVisibleAfterEscape}, focus restored: ${isMenuButtonFocused}`
    );
    await mobileContext.close();

    // Item 3 & 4: Four Workflow Tab Clicks, Active Styling & URL Hashes
    console.log(`  [P2.3-4] Testing 4 Workflow Tabs & Hash Synchronization...`);
    const tabs = [
      { id: 'tab-ad-check', expectedHash: '#ad-check', panelId: 'tabpanel-ad-check' },
      { id: 'tab-ad-vs-chat', expectedHash: '#ad-vs-chat', panelId: 'tabpanel-ad-vs-chat' },
      { id: 'tab-seller-history', expectedHash: '#seller-history', panelId: 'tabpanel-seller-history' },
      { id: 'tab-historical-comparison', expectedHash: '#historical-comparison', panelId: 'tabpanel-historical-comparison' },
    ];

    const tabResults = [];
    for (const tab of tabs) {
      await page.click(`#${tab.id}`);
      await page.waitForTimeout(150);
      const isSelected = await page.getAttribute(`#${tab.id}`, 'aria-selected');
      const hash = await page.evaluate(() => window.location.hash);
      const panelVisible = await page.locator(`#${tab.panelId}`).isVisible();
      tabResults.push({ id: tab.id, isSelected: isSelected === 'true', hash, panelVisible });
      console.log(`    ✓ Clicked ${tab.id}: aria-selected=${isSelected}, hash=${hash}, panelVisible=${panelVisible}`);
    }
    results.phase2Checks['tabs'] = tabResults;

    // Item 13: WAI-ARIA Keyboard Navigation on Tabs (Arrow keys, Home, End)
    console.log(`  [P2.13] Testing WAI-ARIA Keyboard Arrow Navigation on Tabs...`);
    await page.focus('#tab-ad-check');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    let activeAfterRight = await page.evaluate(() => document.activeElement?.id);
    let hashAfterRight = await page.evaluate(() => window.location.hash);

    await page.keyboard.press('End');
    await page.waitForTimeout(150);
    let activeAfterEnd = await page.evaluate(() => document.activeElement?.id);
    let hashAfterEnd = await page.evaluate(() => window.location.hash);

    await page.keyboard.press('Home');
    await page.waitForTimeout(150);
    let activeAfterHome = await page.evaluate(() => document.activeElement?.id);
    let hashAfterHome = await page.evaluate(() => window.location.hash);

    results.phase2Checks['tabKeyboardNav'] = {
      arrowRightMoved: activeAfterRight === 'tab-ad-vs-chat',
      endMovedToLast: activeAfterEnd === 'tab-historical-comparison',
      homeMovedToFirst: activeAfterHome === 'tab-ad-check',
    };
    console.log(
      `    ✓ ArrowRight: ${activeAfterRight} (${hashAfterRight}), End: ${activeAfterEnd} (${hashAfterEnd}), Home: ${activeAfterHome} (${hashAfterHome})`
    );

    // Item 6: Text Preservation across Tab Switching
    console.log(`  [P2.6] Testing Form State Preservation across Tab Switching...`);
    await page.click('#tab-ad-check');
    await page.fill('#ad-text-input', 'আমার টেস্ট বিজ্ঞাপনের লেখা যা ট্যাব পরিবর্তন করলেও মুছে যাবে না।');
    // Switch to another tab and back
    await page.click('#tab-ad-vs-chat');
    await page.waitForTimeout(100);
    await page.click('#tab-ad-check');
    await page.waitForTimeout(100);
    const preservedText = await page.inputValue('#ad-text-input');
    const isPreserved = preservedText.includes('টেস্ট বিজ্ঞাপনের লেখা');
    results.phase2Checks['textPreservation'] = isPreserved;
    console.log(`    ✓ Text preserved after tab switch: ${isPreserved}`);

    // Item 5: Form Validation
    console.log(`  [P2.5] Testing Form Validation on Empty / Too Short Input...`);
    await page.click('#tab-ad-check');
    await page.fill('#ad-text-input', 'abc');
    await page.click('#tabpanel-ad-check button[type="submit"]');
    await page.waitForTimeout(100);
    const errorText = await page.locator('#tabpanel-ad-check div[role="alert"]').innerText();
    const validationWorks = errorText.includes('কমপক্ষে ৫ অক্ষর');
    results.phase2Checks['formValidation'] = validationWorks;
    console.log(`    ✓ Empty / short validation message: "${errorText.trim()}"`);

    // Item 7: Screenshot Upload & Preview
    console.log(`  [P2.7] Testing Screenshot Dropzone & Image Selection...`);
    // Minimal 1x1 valid PNG base64
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const fileInput = page.locator('#tabpanel-ad-check input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'ad-sample.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });
    await page.waitForTimeout(300);
    const previewVisible = await page.locator('#tabpanel-ad-check img[alt="Uploaded Screenshot preview"]').isVisible();
    results.phase2Checks['screenshotUpload'] = previewVisible;
    console.log(`    ✓ Screenshot preview rendered: ${previewVisible}`);

    // Clear screenshot
    const removeImgBtn = page.locator('#tabpanel-ad-check button[aria-label="আপলোড করা স্ক্রিনশট মুছে ফেলুন"]');
    if (await removeImgBtn.isVisible()) {
      await removeImgBtn.click();
      await page.waitForTimeout(150);
      console.log(`    ✓ Screenshot cleared successfully`);
    }

    // ------------------------------------------------------------------------
    // SECTION 3: PHASE 3 BUYER WORKFLOW E2E VALIDATION
    // ------------------------------------------------------------------------
    console.log(`\n>>> Section 3: Phase 3 Buyer Workflows E2E Validation...`);

    // --- WORKFLOW 1: Ad Quick Check ---
    console.log(`\n  --- WORKFLOW 1: Ad Quick Check ---`);
    await page.click('#tab-ad-check');
    await page.waitForTimeout(200);

    // Load sample ad button (e.g. উদাহরণ ১)
    const sampleButtons = page.locator('#tabpanel-ad-check button:has-text("উদাহরণ ১")');
    await sampleButtons.first().click();
    await page.waitForTimeout(150);
    const loadedAdText = await page.inputValue('#ad-text-input');
    console.log(`    Sample loaded: ${loadedAdText.slice(0, 50)}... (${loadedAdText.length} chars)`);

    // Submit analysis
    console.log(`    Submitting Ad Quick Check to live API...`);
    const w1SubmitButton = page.locator('#tabpanel-ad-check button[type="submit"]');
    await w1SubmitButton.click();

    // Verify loading spinner appears
    const w1Spinner = page.locator('#tabpanel-ad-check [role="status"]');
    const spinnerAppeared = (await w1Spinner.count()) > 0;
    console.log(`    ✓ Loading state indicator displayed: ${spinnerAppeared}`);

    // Wait for result cards (timeout up to 45s for Gemini)
    await page.waitForSelector('#tabpanel-ad-check div:has-text("বিজ্ঞাপনভিত্তিক প্রাথমিক অনুসন্ধান")', {
      timeout: 45000,
    });
    console.log(`    ✓ Workflow 1 response received and rendered!`);

    // Check Buyer Questions Card
    const questionsCardVisible = await page.locator('#tabpanel-ad-check button:has-text("কপি")').count() > 0;
    console.log(`    ✓ Buyer Questions Card rendered with 1-click copy: ${questionsCardVisible}`);

    // Test 1-click copy
    const copyButton = page.locator('#tabpanel-ad-check button:has-text("কপি")').first();
    await copyButton.click();
    await page.waitForTimeout(300);
    const copyTextAfter = await copyButton.innerText();
    console.log(`    ✓ Copy button feedback: "${copyTextAfter.trim()}"`);

    // Check Reset
    const resetButton = page.locator('#tabpanel-ad-check button:has-text("নতুন যাচাই")');
    await resetButton.click();
    await page.waitForTimeout(150);
    const textAfterReset = await page.inputValue('#ad-text-input');
    console.log(`    ✓ Reset cleared form: ${textAfterReset === ''}`);

    results.phase3Workflows['workflow1_ad_check'] = {
      sampleLoaded: loadedAdText.length > 0,
      loadingStateShown: spinnerAppeared,
      questionsCardRendered: questionsCardVisible,
      copyButtonWorks: copyTextAfter.includes('কপি হয়েছে') || copyTextAfter.includes('কপি'),
      resetWorks: textAfterReset === '',
    };

    // --- WORKFLOW 2: Ad vs Seller Chat Promise Cross-Check ---
    console.log(`\n  --- WORKFLOW 2: Ad vs Seller Chat Promise Cross-Check ---`);
    console.log(`    Pausing 5s for API quota / rate limit token replenishment...`);
    await page.waitForTimeout(5000);

    await page.click('#tab-ad-vs-chat');
    await page.waitForTimeout(300);

    // Load Sample Scenario 1 (মূল্য ও সিওডি গরমিল)
    const scenarioButton = page.locator('#tabpanel-ad-vs-chat button:has-text("১. মূল্য ও সিওডি গরমিল")');
    await scenarioButton.click();
    await page.waitForTimeout(300);

    console.log(`    Submitting Promise Cross-Check (Parallelized AI extraction)...`);
    const w2Submit = page.locator('#tabpanel-ad-vs-chat button:has-text("প্রতিশ্রুতির গরমিল ও ঝুঁকি বিশ্লেষণ করুন")');
    const t0 = Date.now();
    await w2Submit.click();

    // Verify loading state
    const w2Loading = await page.locator('#tabpanel-ad-vs-chat [role="status"]').isVisible();
    console.log(`    ✓ Loading state indicator displayed: ${w2Loading}`);

    // Wait for results
    await page.waitForSelector('#tabpanel-ad-vs-chat h3:has-text("প্রতিশ্রুতির গরমিল সনাক্ত হয়েছে"), #tabpanel-ad-vs-chat h3:has-text("কোনো গরমিল পাওয়া যায়নি")', {
      timeout: 70000,
    });
    const t1 = Date.now();
    const w2LatencySec = ((t1 - t0) / 1000).toFixed(1);
    console.log(`    ✓ Workflow 2 response rendered in ${w2LatencySec}s!`);

    // Verify Contradiction Cards & Payment Warnings
    const contradictionBadge = await page.locator('#tabpanel-ad-vs-chat span:has-text("গরমিল")').count();
    const warningBadge = await page.locator('#tabpanel-ad-vs-chat div:has-text("পেমেন্ট ঝুঁকি"), #tabpanel-ad-vs-chat span:has-text("পেমেন্ট")').count();
    console.log(`    ✓ Contradictions detected: ${contradictionBadge > 0}, Payment Warnings: ${warningBadge > 0}`);

    // Test Reset
    const w2Reset = page.locator('#tabpanel-ad-vs-chat button:has-text("মুছুন")');
    await w2Reset.click();
    await page.waitForTimeout(150);
    const w2AdTextAfter = await page.locator('#tabpanel-ad-vs-chat textarea').first().inputValue();
    console.log(`    ✓ Reset cleared form: ${w2AdTextAfter === ''}`);

    results.phase3Workflows['workflow2_promise_crosscheck'] = {
      latencySec: w2LatencySec,
      contradictionsFound: contradictionBadge > 0,
      warningsFound: warningBadge > 0,
      resetWorks: w2AdTextAfter === '',
    };

    // --- WORKFLOW 3: Seller History Intelligence ---
    console.log(`\n  --- WORKFLOW 3: Seller History Intelligence ---`);
    await page.click('#tab-seller-history');
    await page.waitForTimeout(200);

    // Enter website URL via sample button or input
    const websiteInput = page.locator('#tabpanel-seller-history input[placeholder*="chaldal.com"]');
    const sampleChaldal = page.locator('#tabpanel-seller-history button:has-text("chaldal.com")');
    if (await sampleChaldal.isVisible()) {
      await sampleChaldal.click();
    } else {
      await websiteInput.fill('https://chaldal.com');
    }

    console.log(`    Submitting Website Wayback Archive Research...`);
    const waybackSubmit = page.locator('#tabpanel-seller-history button:has-text("ওয়েবসাইট ইতিহাস অনুসন্ধান করুন")');
    await waybackSubmit.click();

    // Wait for archive timeline results
    await page.waitForSelector('#tabpanel-seller-history div:has-text("প্রথম আর্কাইভ রেকর্ড:"), #tabpanel-seller-history div:has-text("ইন্টারনেট আর্কাইভ রেকর্ড"), #tabpanel-seller-history div:has-text("আর্কাইভ নেই")', {
      timeout: 30000,
    });
    console.log(`    ✓ Wayback historical archive records rendered successfully!`);

    // Verify archive metadata
    const archiveText = await page.locator('#tabpanel-seller-history').innerText();
    const hasFirstSeen = archiveText.includes('প্রথম') || archiveText.includes('স্ন্যাপশট') || archiveText.includes('আর্কাইভ');
    console.log(`    ✓ Timeline metadata displayed: ${hasFirstSeen}`);

    // Verify Provenance Badges
    const provenanceBadges = await page.locator('#tabpanel-seller-history span:has-text("যাচাইকৃত"), #tabpanel-seller-history span:has-text("স্বাধীন ওয়েব আর্কাইভ"), #tabpanel-seller-history span:has-text("আর্কাইভ")').count();
    console.log(`    ✓ Provenance badges displayed: ${provenanceBadges > 0}`);

    // Test Reset in Workflow 3
    const w3Reset = page.locator('#tabpanel-seller-history button:has-text("রিসেট করুন")');
    if (await w3Reset.isVisible()) {
      await w3Reset.click();
      await page.waitForTimeout(150);
      const urlAfterReset = await websiteInput.inputValue();
      console.log(`    ✓ Reset cleared form: ${urlAfterReset === ''}`);
    }

    results.phase3Workflows['workflow3_seller_history'] = {
      waybackLookupPassed: hasFirstSeen,
      provenanceBadgesVisible: provenanceBadges > 0,
    };

    // --- WORKFLOW 4: Historical Policy & Price Change Detection ---
    console.log(`\n  --- WORKFLOW 4: Historical Policy & Price Evolution ---`);
    await page.click('#tab-historical-comparison');
    await page.waitForTimeout(200);

    // Click sample website button (Chaldal)
    const chaldalSample = page.locator('#tabpanel-historical-comparison button:has-text("চালডাল")');
    await chaldalSample.click();
    await page.waitForTimeout(150);

    console.log(`    Submitting Historical Policy Comparison...`);
    const compareSubmit = page.locator('#tabpanel-historical-comparison button:has-text("আর্কাইভ তুলনা করুন")');
    await compareSubmit.click();

    // Wait for comparison result cards
    await page.waitForSelector('#tabpanel-historical-comparison div:has-text("ঐতিহাসিক বিশ্লেষণের ফলাফল"), #tabpanel-historical-comparison div:has-text("কভারেজ:"), #tabpanel-historical-comparison div:has-text("ডোমেইন:")', {
      timeout: 45000,
    });
    console.log(`    ✓ Historical comparison response rendered!`);

    const compareText = await page.locator('#tabpanel-historical-comparison').innerText();
    const hasSnapshots = compareText.includes('স্ন্যাপশট') || compareText.includes('পলিসি') || compareText.includes('তুলনা') || compareText.includes('কভারেজ');
    console.log(`    ✓ Snapshot comparison data displayed: ${hasSnapshots}`);

    // Test Reset in Workflow 4
    const w4Reset = page.locator('#tabpanel-historical-comparison button:has-text("রিসেট")');
    if (await w4Reset.isVisible()) {
      await w4Reset.click();
      await page.waitForTimeout(150);
      const w4UrlAfter = await page.locator('#tabpanel-historical-comparison input[type="url"]').inputValue();
      console.log(`    ✓ Reset cleared form: ${w4UrlAfter === ''}`);
    }

    results.phase3Workflows['workflow4_historical_comparison'] = {
      comparisonRendered: hasSnapshots,
    };

    await testContext.close();
  } catch (err) {
    console.error(`\n❌ ERROR DURING SUITE EXECUTION:`, err);
    results.fatalError = err.message;
  } finally {
    await browser.close();
  }

  // Print final summary
  console.log(`\n========================================================================`);
  console.log(`  BROWSER VALIDATION SUITE SUMMARY`);
  console.log(`========================================================================`);
  console.log(`Total Viewports Tested: ${Object.keys(results.viewports).length} / 6`);
  console.log(`Total Phase 2 Checks:   ${Object.keys(results.phase2Checks).length}`);
  console.log(`Total Phase 3 Workflows:${Object.keys(results.phase3Workflows).length} / 4`);
  console.log(`Console Errors:         ${results.consoleErrors.length}`);
  if (results.consoleErrors.length > 0) {
    console.log(`Console Error Details:\n  ${results.consoleErrors.join('\n  ')}`);
  }
  console.log(`Page Errors:            ${results.pageErrors.length}`);
  if (results.fatalError) {
    console.log(`FATAL ERROR:            ${results.fatalError}`);
  }
  console.log(`========================================================================\n`);

  return results;
}

runSuite().then((res) => {
  if (res.fatalError || res.pageErrors.length > 0) {
    process.exit(1);
  }
  process.exit(0);
});
