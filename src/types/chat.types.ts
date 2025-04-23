/**
 * Tipi per la chat
 */

import { ContentType } from './content.types';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  streaming?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChatHistory {
  messages: ChatMessage[];
  lastUpdated: number;
}

export interface ChatExportOptions {
  format: 'markdown' | 'json' | 'txt';
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error?: string;
}

/**
 * Base interface for image sources
 */
export interface BaseImageSource {
  type: ContentType.Image;
  media_type?: string;
}

/**
 * Image source using base64 encoding
 */
export interface Base64ImageSource extends BaseImageSource {
  source_type: 'base64';
  data: string;
}

/**
 * Image source using URL
 */
export interface URLImageSource extends BaseImageSource {
  source_type: 'url';
  url: string;
  detail?: 'low' | 'high' | 'auto';
}

/**
 * Union type for all image sources
 */
export type ImageSource = Base64ImageSource | URLImageSource;

/**
 * Image block for messages - unified format
 */
export interface ImageBlock extends BaseImageSource {
  source: ImageSource;
  alt?: string;
} 
 