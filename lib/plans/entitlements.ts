/**
 * StudentAI Entitlements & Pricing-Ready Plan Architecture
 * 
 * Provides architectural hooks for future monetization tiers (Free, Student, Pro, Business)
 * without breaking current user access or introducing fake checkout interfaces.
 */

export type PlanTier = 'FREE' | 'STUDENT' | 'PRO' | 'BUSINESS';

export interface PlanLimits {
  tier: PlanTier;
  name: string;
  description: string;
  aiRequestsPerDay: number;
  maxPdfFileSizeMB: number;
  maxPdfPages: number;
  batchProcessingLimit: number;
  advancedAiAccess: boolean;
  ocrEnabled: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanLimits> = {
  FREE: {
    tier: 'FREE',
    name: 'Free Starter',
    description: 'Essential local-first utilities and study tools for every student.',
    aiRequestsPerDay: 50,
    maxPdfFileSizeMB: 50,
    maxPdfPages: 100,
    batchProcessingLimit: 20,
    advancedAiAccess: true,
    ocrEnabled: true,
  },
  STUDENT: {
    tier: 'STUDENT',
    name: 'Student Pro',
    description: 'Higher limits, faster AI processing, and extended document analysis.',
    aiRequestsPerDay: 200,
    maxPdfFileSizeMB: 100,
    maxPdfPages: 300,
    batchProcessingLimit: 50,
    advancedAiAccess: true,
    ocrEnabled: true,
  },
  PRO: {
    tier: 'PRO',
    name: 'Researcher Pro',
    description: 'High-throughput document translation, OCR, and complex reasoning.',
    aiRequestsPerDay: 500,
    maxPdfFileSizeMB: 200,
    maxPdfPages: 1000,
    batchProcessingLimit: 100,
    advancedAiAccess: true,
    ocrEnabled: true,
  },
  BUSINESS: {
    tier: 'BUSINESS',
    name: 'Campus / Team',
    description: 'Organizational access for academic labs, departments, and study teams.',
    aiRequestsPerDay: 2000,
    maxPdfFileSizeMB: 500,
    maxPdfPages: 2500,
    batchProcessingLimit: 250,
    advancedAiAccess: true,
    ocrEnabled: true,
  },
};

/**
 * Checks whether a given plan tier has access to a specific feature.
 * Currently defaults to open access so no existing users are blocked.
 */
export function checkFeatureAccess(
  _tier: PlanTier = 'FREE',
  _feature: 'ai' | 'pdf_tools' | 'ocr' | 'batch' | 'translation'
): boolean {
  return true;
}

/**
 * Returns the effective file size limit for a given plan tier.
 */
export function getMaxUploadSizeMB(tier: PlanTier = 'FREE'): number {
  return PLAN_CONFIGS[tier]?.maxPdfFileSizeMB ?? 50;
}

/**
 * Returns the maximum page count for document processing.
 */
export function getMaxPageLimit(tier: PlanTier = 'FREE'): number {
  return PLAN_CONFIGS[tier]?.maxPdfPages ?? 100;
}
