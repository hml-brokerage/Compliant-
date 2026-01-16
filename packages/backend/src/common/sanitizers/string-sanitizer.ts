import { Transform } from 'class-transformer';

/**
 * Sanitize string input to prevent XSS attacks
 * Removes or encodes potentially dangerous characters and HTML tags
 * 
 * @example
 * ```typescript
 * export class CreateContractorDto {
 *   @SanitizeString()
 *   @IsString()
 *   name: string;
 * }
 * ```
 */
export function SanitizeString() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // Trim whitespace
    let sanitized = value.trim();

    // Remove or encode common XSS patterns
    sanitized = sanitized
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove object/embed tags
      .replace(/<(object|embed)[^>]*>/gi, '')
      // Remove on* event handlers (onclick, onerror, etc.)
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove data: protocol (can be used for XSS)
      .replace(/data:text\/html/gi, '')
      // Replace HTML entities that could be used for encoding attacks
      .replace(/&lt;script/gi, '')
      .replace(/&lt;iframe/gi, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    return sanitized;
  });
}

/**
 * Sanitize HTML content more aggressively
 * Strips all HTML tags, leaving only plain text
 * Use this for fields that should never contain HTML
 * 
 * @example
 * ```typescript
 * export class UpdateBrokerInfoDto {
 *   @SanitizeHtml()
 *   @IsString()
 *   brokerName?: string;
 * }
 * ```
 */
export function SanitizeHtml() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // Trim whitespace
    let sanitized = value.trim();

    // Strip all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Decode common HTML entities to prevent double-encoding issues
    sanitized = sanitized
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    // Re-encode special characters for safety
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    return sanitized;
  });
}
