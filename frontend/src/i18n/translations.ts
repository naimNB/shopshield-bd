/**
 * ShopShield BD - Centralized Bilingual Translation Dictionary
 * Supporting Bengali (বাংলা) and English (English).
 *
 * Rules:
 * - Default language: Bengali ('bn').
 * - Preserves original extracted quotes verbatim in their original source language.
 * - Changing language toggles the UI instantly without clearing inputs or re-running AI inference.
 */

export type Language = 'bn' | 'en';

export const translations = {
  bn: {
    // Brand & Header
    appTitle: 'ShopShield BD',
    appSubtitle: 'ভোক্তা সুরক্ষা সহকারী',
    navVerify: 'যাচাই',
    navHowItWorks: 'কীভাবে কাজ করে',
    navAbout: 'পরিচিতি',
    skipToMain: 'মূল যাচাইকরণে যান',
    serverOnline: 'অনলাইন',
    serverConnecting: 'সংযোগ...',
    serverOffline: 'অফলাইন',
    githubRepo: 'GitHub রিপোজিটরি দেখুন',
    langToggle: 'English',

    // Hero Section
    heroBadge: 'বাংলাদেশ ই-কমার্স ও এফ-কমার্স সুরক্ষা',
    heroTitle1: 'অনলাইনে কেনাকাটায়',
    heroTitleHighlight: 'প্রতারণা ও গরমিল',
    heroTitle2: 'থেকে নিজেকে সুরক্ষিত রাখুন',
    heroSubtitle:
      'বিজ্ঞাপনের অফার ও চ্যাটের প্রতিশ্রুতি যাচাই করুন। অগ্রিম টাকা পাঠানোর ঝুঁকি চিহ্নিত করুন এবং বিক্রেতার সাথে নিরাপদ লেনদেনের জন্য সঠিক প্রশ্ন জানুন।',
    heroCtaVerify: 'যাচাই শুরু করুন',
    heroCtaHow: 'কীভাবে কাজ করে',
    heroDisclaimer:
      'ShopShield কোনো অনির্ভরযোগ্য অনুমান বা ফেক ট্রাস্ট স্কোর প্রদান করে না। সকল সিদ্ধান্ত দৃশ্যমান প্রমাণের ওপর ভিত্তি করে।',

    // Workflow Hub Tabs
    tabAdCheck: 'বিজ্ঞাপন যাচাই',
    tabAdCheckDesc: 'বিজ্ঞাপনের শর্ত ও ঝুঁকি যাচাই',
    tabAdVsChat: 'বিজ্ঞাপন বনাম চ্যাট',
    tabAdVsChatDesc: 'কথার গরমিল ও পেমেন্ট ঝুঁকি',
    tabPageTransparency: 'পেজ ট্রান্সপারেন্সি',
    tabPageTransparencyDesc: 'নাম পরিবর্তন ও পেজের বয়স',
    tabHistoricalCompare: 'পূর্ববর্তী পলিসি',
    tabHistoricalCompareDesc: 'আগের দাম ও শর্তের পরিবর্তন',

    // Synthetic Demonstration Scenarios
    scenariosHeading: 'নমুনা দৃশ্যপট পরীক্ষা করুন (এক ক্লিকে):',
    scenario1Title: 'বিজ্ঞাপনে COD বনাম চ্যাটে ১০০% অগ্রিম',
    scenario1Desc: 'বিজ্ঞাপনে ক্যাশ অন ডেলিভারি, কিন্তু চ্যাটে ফুল অগ্রিম পেমেন্টের দাবি।',
    scenario2Title: "যাচাইহীন '১০০% আসল' ঘড়ি দাবি",
    scenario2Desc: 'অস্বাভাবিক কম দামে আসল দাবি, ডেলিভারি চার্জ অগ্রিম।',
    scenario3Title: 'দৃশ্যপট ৩: স্পষ্ট শর্তযুক্ত বিজ্ঞাপন',
    scenario3Desc: 'এক্সক্লুসিভ চামড়ার ওয়ালেট, স্পষ্ট ক্যাশ অন ডেলিভারি এবং রিটার্ন শর্ত।',

    // Form Inputs & Actions
    adInputLabel: 'বিজ্ঞাপনের টেক্সট (বা স্ক্রিনশট থেকে টেক্সট):',
    adPlaceholder: 'বিজ্ঞাপনের বিবরণ, ক্যাপশন বা পোস্টের টেক্সট এখানে পেস্ট করুন...',
    chatInputLabel: 'বিক্রেতার চ্যাট / ইনবক্স কথোপকথন:',
    chatPlaceholder: 'মেসেঞ্জার বা হোয়াটসঅ্যাপে বিক্রেতার সাথে কথোপকথন এখানে পেস্ট করুন...',
    urlInputLabel: 'ফেসবুক পেজ বা ওয়েবসাইট লিংক:',
    urlPlaceholder: 'https://facebook.com/sellerpage বা https://shop-domain.com',
    uploadScreenshotBtn: 'স্ক্রিনশট আপলোড',
    analyzeAdBtn: 'বিজ্ঞাপন যাচাই করুন',
    analyzingAdBtn: 'বিজ্ঞাপন যাচাই করা হচ্ছে...',
    compareBtn: 'প্রতিশ্রুতি তুলনা করুন',
    comparingBtn: 'প্রতিশ্রুতি তুলনা করা হচ্ছে...',
    checkPageBtn: 'পেজ তথ্য বিশ্লেষণ করুন',
    checkingPageBtn: 'পেজ তথ্য খোঁজা হচ্ছে...',
    compareHistoryBtn: 'পূর্ববর্তী পলিসি তুলনা করুন',
    comparingHistoryBtn: 'আর্কাইভ তথ্য যাচাই হচ্ছে...',
    clearBtn: 'মুছুন',
    sampleBtn: 'নমুনা দেখুন',
    charCount: 'অক্ষর',
    requiredTextHelp: 'যাচাই শুরু করতে কমপক্ষে ৫টি অক্ষর লিখুন বা স্ক্রিনশট আপলোড করুন।',

    // Screenshot OCR Component
    ocrTitle: 'স্ক্রিনশট থেকে টেক্সট এক্সট্রাকশন',
    ocrDropHint: 'স্ক্রিনশট ফাইল টেনে আনুন অথবা ক্লিক করে আপলোড করুন',
    ocrSupportedFormats: 'PNG, JPEG, WEBP (সর্বোচ্চ ৫ মেগাবাইট)',
    ocrProcessing: 'Gemini দিয়ে স্ক্রিনশটের টেক্সট পড়া হচ্ছে...',
    ocrReviewTitle: 'এক্সট্রাক্ট করা টেক্সট পর্যালোচনা ও সম্পাদনা:',
    ocrReviewHelp: 'প্রয়োজনে টেক্সট এডিট করে নিশ্চিত করুন। মূল লেখা পরিবর্তন হবে না।',
    ocrUseExtractedText: 'টেক্সট নিশ্চিত ও ব্যবহার করুন',
    ocrCancel: 'বাতিল',
    ocrReplacePrompt: 'বর্তমান বক্সে থাকা লেখার কী করবেন?',
    ocrReplaceBtn: 'বর্তমান লেখা প্রতিস্থাপন করুন',
    ocrAppendBtn: 'বর্তমান লেখার শেষে যোগ করুন',

    // Assessment States & Banners
    assessmentBannerTitle: 'সামগ্রিক মূল্যায়ন অবস্থা:',
    warningSignsBadge: 'সতর্কতা সংকেত চিহ্নিত হয়েছে',
    noWarningBadge: 'কোনো নির্দিষ্ট সতর্কতা পাওয়া যায়নি',
    insufficientBadge: 'অপর্যাপ্ত তথ্য — যাচাই সম্ভব হয়নি',
    notProofNotice:
      'সতর্কবার্তা: দৃশ্যমান তথ্যে কোনো অসঙ্গতি না পাওয়ার অর্থ এই নয় যে বিক্রেতা সম্পূর্ণ বিশ্বাসযোগ্য। ডেলিভারির সময় অবশ্যই পণ্য যাচাই করে নিন।',
    recommendedActionLabel: 'ক্রেতার জন্য প্রধান পরামর্শ:',

    // Product Authenticity Card
    authenticityCardTitle: 'পণ্যের সত্যতা ও আসল-নকল মূল্যায়ন',
    authenticityClaimedLabel: 'আসল বলে দাবি করা হয়েছে (স্বাধীনভাবে যাচাইকৃত নয়)',
    authenticityUnverifiedLabel: 'স্বাধীনভাবে যাচাইকৃত নয়',
    authenticityEvidenceLabel: 'বিজ্ঞাপনের দাবি:',
    authenticityStepsTitle: 'আসল পণ্য নিশ্চিত করার শারীরিক পরিদর্শন ধাপ:',
    authenticityDisclaimer:
      'অনলাইন বিজ্ঞাপন বা স্ক্রিনশটের মাধ্যমে পণ্যের বাহ্যিক বা আসল-নকল অবস্থা নিশ্চিত করা অসম্ভব। ডেলিভারির সময় পণ্য যাচাই করে নিন।',

    // Key Warnings & Payment Risks
    warningsCardTitle: 'সতর্কতা ও পেমেন্ট ঝুঁকি',
    noWarningsTitle: 'কোনো ঝুঁকিপূর্ণ পেমেন্ট শর্ত পাওয়া যায়নি',
    severityHigh: 'উচ্চ ঝুঁকি',
    severityCaution: 'সতর্কতা',
    severityInfo: 'তথ্য',
    buyerActionLabel: 'ক্রেতার করণীয়:',
    evidenceQuoteLabel: 'উদ্ধৃতি:',

    // Promise Consistency & Contradictions (Ad vs Chat)
    contradictionsCardTitle: 'বিজ্ঞাপন ও চ্যাটের প্রতিশ্রুতি তুলনা',
    contradictionBadge: 'গরমিল',
    consistentBadge: 'সঙ্গতিপূর্ণ',
    needsReviewBadge: 'পর্যালোচনা প্রয়োজন',
    adStatedLabel: 'বিজ্ঞাপনে বলা হয়েছিল:',
    chatStatedLabel: 'চ্যাটে বিক্রেতা বলেছে:',
    noContradictionsMessage:
      'বিজ্ঞাপনের অফার এবং চ্যাটের মূল শর্তাবলীতে কোনো অসঙ্গতি বা গরমিল পাওয়া যায়নি।',

    // Actionable Buyer Questions
    buyerQuestionsTitle: 'বিক্রেতাকে নিশ্চিত হওয়ার জন্য প্রশ্নগুলো করুন',
    buyerQuestionsSubtitle: 'টাকা পাঠানোর আগে বিক্রেতার চ্যাটে এই প্রশ্নগুলো পাঠিয়ে নিশ্চিত হোন:',
    copyQuestionsBtn: 'প্রশ্নগুলো কপি করুন',
    copiedQuestionsBtn: 'কপি হয়েছে!',

    // Missing Critical Info
    missingInfoTitle: 'বিজ্ঞাপনে অনুপস্থিত গুরুত্বপূর্ণ শর্তাবলী',
    missingInfoDesc: 'এই গুরুত্বপূর্ণ শর্তগুলো বিজ্ঞাপনে উল্লেখ করা নেই:',

    // UI States
    emptyStateTitle: 'এখনও কোনো তথ্য যাচাই করা হয়নি',
    emptyStateDesc: 'উপরে বিজ্ঞাপনের টেক্সট লিখুন অথবা স্ক্রিনশট আপলোড করে যাচাই করুন বাটনে চাপ দিন।',
    loadingStateTitle: 'কৃত্রিম বুদ্ধিমত্তা দিয়ে যাচাই করা হচ্ছে...',
    loadingStateDesc: 'বিজ্ঞাপনের দৃশ্যমান শর্তাবলী ও পেমেন্ট নিরাপত্তা খতিয়ে দেখা হচ্ছে...',
    errorStateTitle: 'যাচাই সম্পন্ন করা যায়নি',
    retryBtn: 'পুনরায় চেষ্টা করুন',

    // How It Works Section
    howItWorksHeading: 'কীভাবে ShopShield কাজ করে',
    howItWorksSubheading: 'নিরাপদ অনলাইন কেনাকাটার ৩টি ধাপ',
    step1Title: 'তথ্য বা স্ক্রিনশট দিন',
    step1Desc: 'বিজ্ঞাপনের টেক্সট লিখুন অথবা ফেসবুক পোস্ট বা মেসেঞ্জারের স্ক্রিনশট আপলোড করুন।',
    step2Title: 'প্রমাণভিত্তিক এআই বিশ্লেষণ',
    step2Desc: 'মূল্য, ক্যাশ অন ডেলিভারি, অগ্রিম টাকা এবং রিটার্ন পলিসি সতর্কভাবে বিশ্লেষণ করা হয়।',
    step3Title: 'নিরাপদ কেনাকাটার সিদ্ধান্ত নিন',
    step3Desc: 'গরমিল জানুন, পেমেন্ট ঝুঁকি বুঝুন এবং বিক্রেতাকে সরাসরি কপি করে পাঠানোর মতো প্রশ্ন পান।',

    // About Section
    aboutHeading: 'ShopShield BD সম্পর্কে',
    aboutSubheading: 'বাংলাদেশের সাধারণ ক্রেতাদের ডিজিটাল সুরক্ষা',
    aboutParagraph1:
      'বাংলাদেশে ফেসবুক এবং সোশ্যাল মিডিয়ায় কেনাকাটা দ্রুত বৃদ্ধি পেয়েছে, কিন্তু সেই সাথে বেড়েছে অগ্রিম টাকা নিয়ে পণ্য না দেওয়া বা বিজ্ঞাপনের সাথে চ্যাটের গরমিলের ঘটনা।',
    aboutParagraph2:
      'ShopShield BD কোনো অনুমানভিত্তিক ভুয়া "ট্রাস্ট স্কোর" বা পণ্যের ১০০% গ্যারান্টি দেয় না। এটি দৃশ্যমান তথ্যের ভিত্তিতে ক্রেতাকে সচেতন করে যেন তারা কোনো অগ্রিম প্রতারণার ফাঁদে না পড়ে।',
    aboutPill1: 'ওপেন-সোর্স ও স্বাধীন',
    aboutPill2: 'প্রমাণভিত্তিক সিদ্ধান্ত',
    aboutPill3: 'গোপনীয়তা সুরক্ষিত',
    aboutOpenSourceDesc: 'অনলাইন ও সোশ্যাল কমার্সে সাধারণ ক্রেতাদের আর্থিক নিরাপত্তা ও অধিকার রক্ষার একটি উন্মুক্ত প্রযুক্তি উদ্যোগ।',
    aboutPrivacyDesc: 'আপনার আপলোড করা স্ক্রিনশট বা চ্যাট আমাদের অ্যাপ সার্ভারে স্থায়ীভাবে জমা রাখা হয় না। টেক্সট এক্সট্রাকশনের জন্য প্রয়োজন অনুযায়ী কনফিগার করা এআই প্রোভাইডারে পাঠানো হয়।',

    // Footer
    footerDeveloperApi: 'ডেভেলপার এপিআই',
    footerHackathonInfo: 'হ্যাকাতন তথ্য',
    footerTagline: 'বাংলাদেশের ই-কমার্স ও এফ-কমার্স ভোক্তাদের সুরক্ষায় নিবেদিত।',
    footerCopyright: '© ২০২৬ ShopShield BD — সর্বস্বত্ব সংরক্ষিত।',

    // Seller History & Web Archive
    sellerHistoryTitle: 'বিক্রেতার ইতিহাস ও আর্কাইভ যাচাই',
    sellerHistoryDesc: 'অনলাইন শপের ওয়েবসাইট আর্কাইভ এবং ফেসবুক পেজ ট্রান্সপারেন্সির নির্ভরযোগ্য রেকর্ড অনুসন্ধান করুন।',
    sellerSubModeProfile: 'বিক্রেতার প্রোফাইল ও ওয়েব রেকর্ড',
    sellerSubModeComparison: 'পূর্ববর্তী পলিসি ও মূল্যের পরিবর্তন',
    sellerSampleLinks: 'নমুনা লিঙ্ক:',
    sellerWebsiteUrlLabel: 'অনলাইন শপ ওয়েবসাইট লিঙ্ক',
    sellerWebsiteUrlPlaceholder: 'https://daraz.com.bd অথবা chaldal.com',
    sellerFbTransparencyTitle: 'ফেসবুক পেজ ট্রান্সপারেন্সি স্ক্রিনশট যোগ করুন (ঐচ্ছিক)',
    sellerFbTransparencyHelp: "ফেসবুক পেজের 'Page Transparency' বা 'About' সেকশনের স্ক্রিনশট আপলোড করলে পেজ তৈরির তারিখ ও পূর্বের নাম পরিবর্তন পরীক্ষা করা হবে।",
    sellerSelectScreenshot: 'স্ক্রিনশট ফাইল নির্বাচন করুন',
    sellerAnalyzeBtn: 'ওয়েবসাইট ইতিহাস অনুসন্ধান করুন',
    sellerAnalyzingBtn: 'আর্কাইভ অনুসন্ধান হচ্ছে...',
    sellerResetBtn: 'রিসেট করুন',
    sellerSummaryTitle: 'সংক্ষেপে যা পাওয়া গেছে',
    sellerEarliestSnapshot: 'প্রথম সংরক্ষিত স্ন্যাপশট',
    sellerTotalSnapshots: 'মোট আর্কাইভ নমুনা',
    sellerArchiveDisclaimer: 'ℹ️ প্রথম আর্কাইভ তারিখ ডোমেইন খোলার বা ব্যবসা প্রতিষ্ঠার প্রমাণ নয়। এটি কেবল ওয়েব আর্কাইভে প্রথম রেকর্ড হওয়ার প্রমাণ।',
    sellerPublicArchiveLinks: 'যাচাইযোগ্য পাবলিক আর্কাইভ লিঙ্কসমূহ:',
    sellerFbPageRecord: 'ফেসবুক পেজ রেকর্ড',
    sellerPageName: 'পেজের নাম:',
    sellerPageCreationDate: 'পেজ তৈরির তারিখ:',
    sellerBuyerQuestionsTitle: 'বিক্রেতার বিশ্বাসযোগ্যতা যাচাইয়ে করণীয় প্রশ্ন',
    sellerDetailedEvidence: 'বিস্তারিত প্রমাণ ও সোর্স মেটাডাটা',
  },
  en: {
    // Brand & Header
    appTitle: 'ShopShield BD',
    appSubtitle: 'AI Consumer Protection',
    navVerify: 'Verify',
    navHowItWorks: 'How It Works',
    navAbout: 'About',
    skipToMain: 'Skip to main content',
    serverOnline: 'Online',
    serverConnecting: 'Connecting...',
    serverOffline: 'Offline',
    githubRepo: 'View GitHub Repository',
    langToggle: 'বাংলা',

    // Hero Section
    heroBadge: 'Bangladesh E-Commerce & F-Commerce Protection',
    heroTitle1: 'Verify online shopping claims',
    heroTitleHighlight: 'Before you pay',
    heroTitle2: 'Evidence-based buyer protection',
    heroSubtitle:
      'Verify public advertisement promises against private chat terms. Identify advance payment risks and generate verification questions before you send funds.',
    heroCtaVerify: 'Start Verification',
    heroCtaHow: 'How It Works',
    heroDisclaimer:
      'ShopShield does not generate speculative scam scores or fake trust metrics. Every assessment is grounded strictly in observable evidence.',

    // Workflow Hub Tabs
    tabAdCheck: 'Ad Quick Check',
    tabAdCheckDesc: 'Evaluate public ad claims & risks',
    tabAdVsChat: 'Ad vs Seller Chat',
    tabAdVsChatDesc: 'Detect promise contradictions & traps',
    tabPageTransparency: 'Page Transparency',
    tabPageTransparencyDesc: 'Page age, renames & admin locations',
    tabHistoricalCompare: 'Historical Comparison',
    tabHistoricalCompareDesc: 'Archive timeline & policy changes',

    // Synthetic Demonstration Scenarios
    scenariosHeading: 'Try Demonstration Scenarios (One-click):',
    scenario1Title: 'Ad COD vs Chat 100% Advance',
    scenario1Desc: 'Ad promised Cash on Delivery, but chat demands 100% full advance.',
    scenario2Title: "Unverified 'Original' Watch Claim",
    scenario2Desc: 'Suspiciously discounted original claim with courier advance demand.',
    scenario3Title: 'Scenario 3: Clear Advertised Terms',
    scenario3Desc: 'Exclusive leather wallet with transparent Cash on Delivery and return conditions.',

    // Form Inputs & Actions
    adInputLabel: 'Advertisement Text (or extracted from screenshot):',
    adPlaceholder: 'Paste public advertisement text, caption, or post here...',
    chatInputLabel: 'Seller Chat / Messenger Conversation:',
    chatPlaceholder: 'Paste conversation with the seller here...',
    urlInputLabel: 'Facebook Page or Website URL:',
    urlPlaceholder: 'https://facebook.com/sellerpage or https://shop-domain.com',
    uploadScreenshotBtn: 'Upload Screenshot',
    analyzeAdBtn: 'Analyze Advertisement',
    analyzingAdBtn: 'Analyzing Advertisement...',
    compareBtn: 'Compare Promises',
    comparingBtn: 'Comparing Promises...',
    checkPageBtn: 'Analyze Page Details',
    checkingPageBtn: 'Retrieving Page Details...',
    compareHistoryBtn: 'Compare Historical Policies',
    comparingHistoryBtn: 'Analyzing Archive Data...',
    clearBtn: 'Clear',
    sampleBtn: 'Load Sample',
    charCount: 'chars',
    requiredTextHelp: 'Enter at least 5 characters or upload a screenshot to begin analysis.',

    // Screenshot OCR Component
    ocrTitle: 'Extract Text from Screenshot',
    ocrDropHint: 'Drag & drop screenshot here, or click to browse',
    ocrSupportedFormats: 'PNG, JPEG, WEBP (Up to 5 MB)',
    ocrProcessing: 'Transcribing text via Google Gemini OCR...',
    ocrReviewTitle: 'Extracted Text Review & Edit:',
    ocrReviewHelp: 'You can review and edit the text before applying it. Original image is never stored.',
    ocrUseExtractedText: 'Confirm & Use Text',
    ocrCancel: 'Cancel',
    ocrReplacePrompt: 'How would you like to handle existing text in the input box?',
    ocrReplaceBtn: 'Replace current text',
    ocrAppendBtn: 'Append to current text',

    // Assessment States & Banners
    assessmentBannerTitle: 'Overall Assessment Status:',
    warningSignsBadge: 'Warning Signs Detected',
    noWarningBadge: 'No Specific Warning Signs Found',
    insufficientBadge: 'Insufficient Evidence — Inconclusive',
    notProofNotice:
      'Disclaimer: The absence of observable warning signs does NOT guarantee seller legitimacy. Always inspect goods in person upon delivery before paying.',
    recommendedActionLabel: 'Primary Recommended Action:',

    // Product Authenticity Card
    authenticityCardTitle: 'Product Authenticity Assessment',
    authenticityClaimedLabel: 'Claimed as Original (Not independently verified)',
    authenticityUnverifiedLabel: 'Not independently verified',
    authenticityEvidenceLabel: 'Claim in Text:',
    authenticityStepsTitle: 'Physical Verification & Inspection Steps:',
    authenticityDisclaimer:
      'Online advertisements and screenshots cannot verify physical product authenticity. Always inspect the item in person upon delivery.',

    // Key Warnings & Payment Risks
    warningsCardTitle: 'Warning Signs & Payment Risks',
    noWarningsTitle: 'No Elevated Payment Risks Detected',
    severityHigh: 'High Risk',
    severityCaution: 'Caution',
    severityInfo: 'Info',
    buyerActionLabel: 'Recommended Buyer Action:',
    evidenceQuoteLabel: 'Evidence Quote:',

    // Promise Consistency & Contradictions (Ad vs Chat)
    contradictionsCardTitle: 'Promise Consistency & Contradictions',
    contradictionBadge: 'Contradiction',
    consistentBadge: 'Consistent',
    needsReviewBadge: 'Needs Clarification',
    adStatedLabel: 'Ad Stated:',
    chatStatedLabel: 'Seller Chat Stated:',
    noContradictionsMessage:
      'No contradictions or discrepancies were detected between the public advertisement and private conversation.',

    // Actionable Buyer Questions
    buyerQuestionsTitle: 'Verification Questions to Ask Seller',
    buyerQuestionsSubtitle: 'Send these targeted questions to the seller in chat before transferring any money:',
    copyQuestionsBtn: 'Copy Questions',
    copiedQuestionsBtn: 'Copied!',

    // Missing Critical Info
    missingInfoTitle: 'Missing Purchase Terms',
    missingInfoDesc: 'These important commercial terms were omitted from the advertisement:',

    // UI States
    emptyStateTitle: 'No Verification Conducted Yet',
    emptyStateDesc: 'Provide advertisement text or upload a screenshot and click Verify.',
    loadingStateTitle: 'AI Evidence Verification in Progress...',
    loadingStateDesc: 'Analyzing commercial commitments and evaluating payment exposure...',
    errorStateTitle: 'Verification Could Not Complete',
    retryBtn: 'Try Again',

    // How It Works Section
    howItWorksHeading: 'How ShopShield Works',
    howItWorksSubheading: '3 Simple Steps to Safer Shopping',
    step1Title: 'Input Text or Screenshot',
    step1Desc: 'Paste advertisement text or upload screenshots from Facebook, WhatsApp, or Messenger.',
    step2Title: 'Evidence-Based Extraction',
    step2Desc: 'Google Gemini extracts price, Cash on Delivery, advance payment requirements, and return terms.',
    step3Title: 'Make Safe Decisions',
    step3Desc: 'Spot discrepancies, understand advance payment risks, and copy verification questions for the seller.',

    // About Section
    aboutHeading: 'About ShopShield BD',
    aboutSubheading: 'Protecting Bangladesh Online Consumers',
    aboutParagraph1:
      'F-commerce and social shopping in Bangladesh are booming, but buyers often face misleading ads, undisclosed terms, and advance payment traps.',
    aboutParagraph2:
      'ShopShield BD avoids artificial scam scores or empty guarantees. Instead, it equips consumers with clear, evidence-based analysis and practical verification steps.',
    aboutPill1: 'Open-Source & Independent',
    aboutPill2: 'Evidence-Based Verification',
    aboutPill3: 'Privacy-Preserving',
    aboutOpenSourceDesc: 'An open-source technology initiative designed to help online and social-commerce buyers in Bangladesh understand financial risks and consumer protections.',
    aboutPrivacyDesc: 'Uploaded screenshots and chat content are processed without permanent storage on our application server. Image content is sent to the configured AI provider for extraction when necessary.',

    // Footer
    footerDeveloperApi: 'Developer API',
    footerHackathonInfo: 'Hackathon Information',
    footerTagline: 'Empowering consumers across Bangladesh with transparent, evidence-based e-commerce verification.',
    footerCopyright: '© 2026 ShopShield BD — All rights reserved.',

    // Seller History & Web Archive
    sellerHistoryTitle: 'Seller History & Archive Verification',
    sellerHistoryDesc: 'Research verified online shop website archives and Facebook Page Transparency records.',
    sellerSubModeProfile: 'Seller Profile & Web Archive',
    sellerSubModeComparison: 'Historical Policy & Price Changes',
    sellerSampleLinks: 'Sample Links:',
    sellerWebsiteUrlLabel: 'Online Shop Website URL',
    sellerWebsiteUrlPlaceholder: 'https://daraz.com.bd or chaldal.com',
    sellerFbTransparencyTitle: 'Add Facebook Page Transparency Screenshot (Optional)',
    sellerFbTransparencyHelp: "Uploading a screenshot of the Facebook 'Page Transparency' or 'About' section verifies page creation date and past name changes.",
    sellerSelectScreenshot: 'Select screenshot file',
    sellerAnalyzeBtn: 'Research Website History',
    sellerAnalyzingBtn: 'Searching Archive...',
    sellerResetBtn: 'Reset',
    sellerSummaryTitle: 'Summary of Findings',
    sellerEarliestSnapshot: 'Earliest Archived Snapshot',
    sellerTotalSnapshots: 'Total Archived Snapshots',
    sellerArchiveDisclaimer: 'ℹ️ The earliest archive date does not prove the domain launch or business founding date. It only proves when it was first recorded in web archives.',
    sellerPublicArchiveLinks: 'Verifiable Public Archive Links:',
    sellerFbPageRecord: 'Facebook Page Records',
    sellerPageName: 'Page Name:',
    sellerPageCreationDate: 'Page Creation Date:',
    sellerBuyerQuestionsTitle: 'Questions to Verify Seller Credibility',
    sellerDetailedEvidence: 'Detailed Evidence & Source Metadata',
  },
} as const;

export type TranslationKey = keyof typeof translations.bn;
