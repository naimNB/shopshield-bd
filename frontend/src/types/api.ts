/**
 * ShopShield BD - API Type Definitions
 *
 * Faithfully mirrors backend schemas across all 4 verification workflows:
 * 1. Advertisement Quick Check
 * 2. Advertisement vs Seller Chat Cross-Referencing
 * 3. Seller History & Page Transparency
 * 4. Historical Policy & Price Comparison
 */

export type UnifiedFindingStatus =
  | 'STATED_CLAIM'
  | 'AGREEMENT'
  | 'CONTRADICTION'
  | 'MISSING_INFORMATION'
  | 'AMBIGUOUS'
  | 'HISTORICAL_CHANGE'
  | 'NEEDS_REVIEW'
  | 'SOURCE_UNAVAILABLE';

export type SourceType =
  | 'USER_SCREENSHOT'
  | 'INTERNET_ARCHIVE_CDX'
  | 'COMMERCE_REGISTRY'
  | 'UNVERIFIED_INPUT'
  | 'USER_INPUT'
  | 'ADVERTISEMENT_TEXT'
  | 'SELLER_CHAT'
  | 'WAYBACK_SNAPSHOT_PAGE'
  | 'EXTERNAL_DATABASE';

export type VerificationStatus =
  | 'USER_PROVIDED_UNVERIFIED'
  | 'INDEPENDENTLY_RETRIEVED'
  | 'UNAVAILABLE'
  | 'NEEDS_REVIEW';

export type CoverageStatus =
  | 'DATE_RANGE_VERIFIED'
  | 'PARTIAL_COVERAGE'
  | 'NO_ARCHIVES'
  | 'SOURCE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'TIMEOUT';

export type TemporalChangeStatus =
  | 'CHANGED'
  | 'UNCHANGED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_COMPARABLE'
  | 'NEEDS_REVIEW';

export interface UnifiedFinding {
  finding_id: string;
  claim_type: string;
  field_label: string;
  status: UnifiedFindingStatus;
  observed_value: unknown;
  source_type: SourceType;
  source_url?: string | null;
  evidence_quote?: string | null;
  observation_date?: string | null;
  retrieval_date: string;
  verification_status: VerificationStatus;
  evidence_confidence?: string | null;
  explanation: string;
  severity: 'high' | 'medium' | 'low' | 'info' | string;
  limitations: string;
  review_reason?: string | null;
}

export interface SingleClaim {
  claim_type: string;
  normalized_value: string | null;
  original_evidence: string | null;
  source_type: string;
  is_supported: boolean;
}

export interface ExtractedClaims {
  source_type: string;
  product_name: string | null;
  price: number | null;
  currency: string | null;
  price_evidence: string | null;
  cod_available: boolean | null;
  cod_evidence: string | null;
  advance_payment_required: boolean | null;
  advance_payment_amount: number | null;
  advance_payment_purpose: string | null;
  advance_payment_evidence: string | null;
  payment_methods: string[];
  payment_methods_evidence: string | null;
  return_policy_available: boolean | null;
  return_policy_terms: string | null;
  return_policy_evidence: string | null;
  warranty_available: boolean | null;
  warranty_terms: string | null;
  warranty_evidence: string | null;
  delivery_conditions: string | null;
  delivery_evidence: string | null;
  urgency_or_pressure: string | null;
  urgency_evidence: string | null;
  claims_list: SingleClaim[];
  unsupported_claims: SingleClaim[];
}

export interface ComparisonItem {
  field: string;
  field_label: string;
  status: 'CONTRADICTION' | 'CONSISTENT' | 'INSUFFICIENT_INFORMATION' | 'NEEDS_REVIEW';
  ad_evidence: string | null;
  chat_evidence: string | null;
  explanation: string;
  severity: string;
}

export interface PaymentWarning {
  type: string;
  severity: string;
  supporting_evidence: string | null;
  explanation: string;
  suggested_buyer_action: string;
}

export interface MissingInfoItem {
  field: string;
  field_label: string;
  description: string;
  importance: string;
}

export interface AnalysisMetadata {
  model_used: string | null;
  ad_char_count: number;
  chat_char_count: number;
  execution_time_ms: number | null;
  [key: string]: unknown;
}

export type AssessmentState =
  | 'WARNING_SIGNS_FOUND'
  | 'NO_SPECIFIC_WARNING_SIGNS_FOUND'
  | 'INSUFFICIENT_EVIDENCE';

export interface AssessmentSummary {
  headline_bn: string;
  headline_en: string;
  explanation_bn: string;
  explanation_en: string;
  primary_action_bn: string;
  primary_action_en: string;
}

export interface ProductAuthenticityAssessment {
  status: 'CLAIMED_ORIGINAL' | 'NOT_INDEPENDENTLY_VERIFIED' | 'INSUFFICIENT_EVIDENCE';
  status_label_bn: string;
  status_label_en: string;
  claim_detected: boolean;
  claim_evidence?: string | null;
  explanation_bn: string;
  explanation_en: string;
  verification_steps_bn: string[];
  verification_steps_en: string[];
  disclaimer_bn: string;
  disclaimer_en: string;
}

// 1. Advertisement Quick Check
export interface AdAnalysisRequest {
  advertisement_text: string;
  product_context?: string | null;
  seller_context?: string | null;
}

export interface AdAnalysisResponse {
  status: string;
  overall_assessment?: AssessmentState;
  assessment_summary?: AssessmentSummary | null;
  product_authenticity?: ProductAuthenticityAssessment | null;
  advertisement_claims: ExtractedClaims;
  findings: UnifiedFinding[];
  explicit_terms: string[];
  missing_critical_info: MissingInfoItem[];
  ambiguous_statements: string[];
  payment_considerations: PaymentWarning[];
  buyer_questions_bangla: string[];
  buyer_questions_en?: string[];
  source_coverage: string;
  limitations: string;
  metadata: AnalysisMetadata;
}

// 2. Advertisement vs Seller Chat
export interface AnalyzeRequest {
  advertisement_text: string;
  seller_chat_text: string;
  product_context?: string | null;
}

export interface AnalyzeResponse {
  status: string;
  overall_assessment?: AssessmentState;
  assessment_summary?: AssessmentSummary | null;
  product_authenticity?: ProductAuthenticityAssessment | null;
  has_contradictions: boolean;
  contradiction_count: number;
  needs_review_count: number;
  advertisement_claims: ExtractedClaims;
  seller_chat_claims: ExtractedClaims;
  comparison_results: ComparisonItem[];
  payment_warnings: PaymentWarning[];
  missing_information: MissingInfoItem[];
  buyer_questions_bangla: string[];
  buyer_questions_en?: string[];
  unified_findings?: UnifiedFinding[];
  metadata: AnalysisMetadata;
}

// Screenshot OCR
export interface ScreenshotExtractionResponse {
  status: string;
  extracted_text: string;
  char_count: number;
  confidence: string;
  model_used: string;
}

// 3. Seller History
export interface EvidenceFinding {
  finding_id: string;
  field_name: string;
  field_label: string;
  observed_value: unknown;
  source_type: SourceType;
  source_url?: string | null;
  observation_date?: string | null;
  retrieval_date: string;
  evidence_text?: string | null;
  verification_status: VerificationStatus;
  evidence_confidence?: string | null;
  limitations: string;
  review_reason?: string | null;
}

export interface PageNameChange {
  previous_name: string;
  change_date: string | null;
  evidence_text: string | null;
}

export interface PageManagerLocation {
  country: string;
  count: number | null;
  evidence_text: string | null;
}

export interface PageTransparencyData {
  page_name: string | null;
  page_creation_date: string | null;
  page_age_months: number | null;
  name_changes_count: number;
  name_changes: PageNameChange[];
  merge_history: string | null;
  manager_locations: PageManagerLocation[];
  is_running_ads: boolean | null;
  unreadable_or_missing_fields: string[];
  timeline_consistency_status: string;
  timeline_conflicts: string[];
  raw_extracted_text: string;
}

export interface PageTransparencyResponse {
  status: string;
  transparency_data: PageTransparencyData;
  findings: EvidenceFinding[];
  buyer_questions: string[];
  disclaimer: string;
  model_used?: string | null;
}

export interface WebsiteArchiveSnapshot {
  timestamp: string;
  formatted_date: string;
  snapshot_url: string;
  status_code?: string | null;
}

export interface WebsiteArchiveData {
  target_url: string;
  cleaned_domain: string;
  archive_available: boolean;
  coverage_status: CoverageStatus | string;
  earliest_snapshot: WebsiteArchiveSnapshot | null;
  latest_snapshot: WebsiteArchiveSnapshot | null;
  sample_snapshots_count: number;
  sample_snapshots: WebsiteArchiveSnapshot[];
  total_snapshots_observed: number;
  total_captures_estimate?: string | null;
  data_limitations: string;
}

export interface WebsiteHistoryRequest {
  url: string;
}

export interface WebsiteHistoryResponse {
  status: string;
  website_data: WebsiteArchiveData;
  findings: EvidenceFinding[];
  buyer_questions: string[];
  disclaimer: string;
}

export interface SellerHistoryReportRequest {
  transparency_data?: PageTransparencyData | null;
  website_url?: string | null;
}

export interface SellerHistoryReportResponse {
  status: string;
  independently_retrieved: EvidenceFinding[];
  user_provided_screenshots: EvidenceFinding[];
  unverified_or_unavailable: EvidenceFinding[];
  buyer_verification_questions: string[];
  overall_summary: string;
  disclaimer: string;
}

// 4. Historical Policy & Price Comparison
export interface HistoricalPolicyClaims {
  product_name: string | null;
  price: number | null;
  currency: string | null;
  price_evidence: string | null;
  cod_available: boolean | null;
  cod_evidence: string | null;
  advance_payment_required: boolean | null;
  advance_payment_amount: number | null;
  advance_payment_evidence: string | null;
  delivery_charge: number | null;
  delivery_charge_evidence: string | null;
  return_policy_available: boolean | null;
  return_days: number | null;
  return_policy_terms: string | null;
  return_policy_evidence: string | null;
  replacement_terms: string | null;
  replacement_evidence: string | null;
  warranty_available: boolean | null;
  warranty_terms: string | null;
  warranty_evidence: string | null;
  raw_text_snippet: string | null;
}

export interface HistoricalSnapshotContent {
  timestamp: string;
  formatted_date: string;
  snapshot_url: string;
  raw_content_url?: string | null;
  status_code: number;
  content_bytes: number;
  extracted_text_chars: number;
  claims?: HistoricalPolicyClaims | null;
  fetch_status: string;
  page_type: string;
  final_url?: string | null;
  redirect_domain?: string | null;
  is_off_domain_redirect: boolean;
  content_type?: string | null;
}

export interface TemporalFieldComparison {
  field: string;
  field_label: string;
  status: TemporalChangeStatus;
  previous_value?: string | null;
  new_value?: string | null;
  earlier_date?: string | null;
  later_date?: string | null;
  earlier_evidence_quote?: string | null;
  later_evidence_quote?: string | null;
  earliest_archive_url?: string | null;
  latest_archive_url?: string | null;
  retrieval_timestamp: string;
  explanation: string;
  limitations: string;
}

export interface CompareHistoryRequest {
  website_url: string;
  page_path?: string | null;
  earlier_timestamp?: string | null;
  later_timestamp?: string | null;
}

export interface CompareHistoryResponse {
  status: string;
  research_status: string;
  target_url: string;
  cleaned_domain: string;
  coverage_status: string;
  comparison_scope: string;
  scope_explanation?: string | null;
  earlier_snapshot?: HistoricalSnapshotContent | null;
  later_snapshot?: HistoricalSnapshotContent | null;
  comparisons: TemporalFieldComparison[];
  has_changes: boolean;
  changes_count: number;
  buyer_questions_bangla: string[];
  disclaimer: string;
  metadata: Record<string, unknown>;
}
