export type PdfToolCategory =
  | 'organization'
  | 'optimize'
  | 'convert_to'
  | 'convert_from'
  | 'editing'
  | 'security'
  | 'forms'
  | 'analysis'
  | 'ai'
  | 'conversion'
  | 'optimization'
  | 'scanning';

export type PdfToolStatus =
  | 'PRODUCTION'
  | 'LIMITED'
  | 'BETA'
  | 'COMING_SOON'
  | 'READY'
  | 'EXPERIMENTAL'
  | 'DISABLED';

export type PdfProcessingMode = 'client' | 'server' | 'hybrid';

export interface PdfToolDefinition {
  id: string;
  slug: string;
  name: string;
  category: PdfToolCategory;
  description: string;
  icon: string;
  status: PdfToolStatus;
  processingMode: PdfProcessingMode;
  supportedInputTypes: string[];
  supportedOutputTypes: string[];
  maxFileSizeMB: number;
  maxPages: number;
  requiresAI: boolean;
  requiresServer: boolean;
  limitations: string;
  privacyNote: string;
  badge?: string;
  isPopular?: boolean;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
}

export type ProgressCallback = (percent: number, step: string) => void;

export interface PageNumberOptions {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  startNumber?: number;
  fontSize?: number;
  format?: 'number' | 'page_of_total';
  margin?: number;
}

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageDataUrl?: string;
  opacity?: number; // 0.1 to 1.0
  rotationDegrees?: number;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  pages?: 'all' | number[];
}

export interface SignatureOptions {
  type: 'draw' | 'type' | 'image';
  dataUrl: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface RedactionBox {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FormFieldInfo {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'other';
  value: string | boolean;
  options?: string[];
}

export interface CompressionResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercentage: number;
  isSmaller: boolean;
}

export interface PageInfo {
  pageNumber: number;
  rotation: number;
  width: number;
  height: number;
  thumbnailUrl?: string;
}
