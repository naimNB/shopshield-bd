/**
 * ShopShield BD - Centralized Typed API Client
 *
 * Implements clean, type-safe communication with the FastAPI backend across all 4 workflows:
 * - Advertisement Quick Check (/api/v1/analyze-ad)
 * - Ad vs Seller Chat Promise Comparison (/api/v1/analyze)
 * - Gemini Multimodal Screenshot OCR (/api/v1/extract-screenshot)
 * - Facebook Page Transparency Analysis (/api/v1/seller-history/page-transparency)
 * - Wayback Historical Archive Verification (/api/v1/seller-history/website)
 * - Consolidated Seller History Report (/api/v1/seller-history/report)
 * - Historical Policy & Price Comparison (/api/v1/seller-history/compare)
 */

import { API_BASE_URL } from '../config';
import type {
  AdAnalysisRequest,
  AdAnalysisResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  ScreenshotExtractionResponse,
  PageTransparencyResponse,
  WebsiteHistoryResponse,
  SellerHistoryReportRequest,
  SellerHistoryReportResponse,
  CompareHistoryRequest,
  CompareHistoryResponse,
} from '../types/api';

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 65_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  options?: RequestOptions
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);

  if (options?.signal) {
    if (options.signal.aborted) {
      clearTimeout(id);
      controller.abort(options.signal.reason);
    } else {
      options.signal.addEventListener('abort', () => {
        clearTimeout(id);
        controller.abort(options.signal?.reason);
      }, { once: true });
    }
  }

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    if (controller.signal.aborted) {
      if (options?.signal?.aborted) {
        throw new Error('অনুরোধ বাতিল করা হয়েছে');
      }
      throw new Error(`সার্ভার থেকে সাড়া পেতে বেশি সময় লাগছে (টাইমআউট ${Math.round(timeoutMs / 1000)} সেকেন্ড)। অনুগ্রহ করে পুনরায় চেষ্টা করুন।`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function handleResponse<T>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    let errorDetail: string | undefined;
    try {
      const errJson = await res.json();
      if (typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        // FastAPI 422 validation errors
        errorDetail = errJson.detail.map((d: { msg?: string; loc?: string[] }) => d.msg || JSON.stringify(d)).join('; ');
      } else if (errJson.message) {
        errorDetail = errJson.message;
      }
    } catch {
      // Non-JSON response body
    }
    const message = errorDetail || `${fallbackError} (HTTP ${res.status})`;
    throw new ApiError(res.status, message, errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /**
   * Root system health check.
   */
  async checkHealth(options?: RequestOptions): Promise<{ status: string; project: string; version: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }, options);
    return handleResponse(res, 'Health check failed');
  },

  /**
   * Multimodal Gemini OCR for image extraction.
   * Extracts text from advertisements, seller chat screenshots, or receipts.
   */
  async extractScreenshot(file: File, options?: RequestOptions): Promise<ScreenshotExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/extract-screenshot`, {
      method: 'POST',
      body: formData,
    }, options);
    return handleResponse<ScreenshotExtractionResponse>(res, 'স্ক্রিনশট থেকে টেক্সট এক্সট্রাকশন ব্যর্থ হয়েছে');
  },

  /**
   * Entry Point 1: Advertisement Quick Check.
   * Analyzes ad text or OCR result for explicit commitments, omitted terms, payment considerations,
   * and generates targeted Bangla buyer verification questions.
   */
  async analyzeAd(payload: AdAnalysisRequest, options?: RequestOptions): Promise<AdAnalysisResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/analyze-ad`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    }, options);
    return handleResponse<AdAnalysisResponse>(res, 'বিজ্ঞাপন বিশ্লেষণ সম্পন্ন করা যায়নি');
  },

  /**
   * Entry Point 2: Advertisement vs Seller Chat Cross-Referencing.
   * Evaluates contradictions, consistency, missing info, and payment safety risks between public ad and private chat.
   */
  async analyzeAdVsChat(payload: AnalyzeRequest, options?: RequestOptions): Promise<AnalyzeResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    }, options);
    return handleResponse<AnalyzeResponse>(res, 'প্রতিশ্রুতি যাচাই বিশ্লেষণ সম্পন্ন করা যায়নি');
  },

  /**
   * Entry Point 3 (Part A): Facebook Page Transparency Screenshot OCR.
   * Extracts page creation date, admin locations, and name change history.
   */
  async analyzePageTransparency(file: File, options?: RequestOptions): Promise<PageTransparencyResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/seller-history/page-transparency`, {
      method: 'POST',
      body: formData,
    }, options);
    return handleResponse<PageTransparencyResponse>(res, 'পেজ ট্রান্সপারেন্সি স্ক্রিনশট বিশ্লেষণ ব্যর্থ হয়েছে');
  },

  /**
   * Entry Point 3 (Part B): Internet Archive Wayback CDX lookup.
   * Queries independent historical web archive records for a website URL.
   */
  async fetchWebsiteHistory(url: string, options?: RequestOptions): Promise<WebsiteHistoryResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/seller-history/website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ url }),
    }, options);
    return handleResponse<WebsiteHistoryResponse>(res, 'ওয়েবসাইট আর্কাইভ রেকর্ড অনুসন্ধান ব্যর্থ হয়েছে');
  },

  /**
   * Entry Point 3 (Part C): Consolidated Seller History Intelligence Report.
   * Combines Page Transparency screenshot data with Wayback archive records into verified vs unverified findings.
   */
  async fetchSellerHistoryReport(payload: SellerHistoryReportRequest, options?: RequestOptions): Promise<SellerHistoryReportResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/seller-history/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    }, options);
    return handleResponse<SellerHistoryReportResponse>(res, 'সেলার হিস্টোরি রিপোর্ট তৈরি করা যায়নি');
  },

  /**
   * Entry Point 4: Historical Policy & Price Change Detection.
   * Compares archived snapshots over time to detect shifts in return policy, warranty, delivery terms, or price.
   */
  async compareHistoricalPolicy(payload: CompareHistoryRequest, options?: RequestOptions): Promise<CompareHistoryResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/seller-history/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    }, options);
    return handleResponse<CompareHistoryResponse>(res, 'ঐতিহাসিক পলিসি পরিবর্তন বিশ্লেষণ ব্যর্থ হয়েছে');
  },
};
