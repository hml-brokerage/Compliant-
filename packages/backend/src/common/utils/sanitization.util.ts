import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes text input to prevent XSS attacks
 * @param text - The text to sanitize
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeText(text: string | undefined): string | undefined {
  if (!text) {
    return text;
  }
  
  return DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [] // Strip all attributes
  });
}
