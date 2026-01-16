/**
 * Validates if a URL is a valid file URL
 * @param url - The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidFileUrl(url: string | undefined): boolean {
  if (!url) {
    return true; // Optional fields are valid when empty
  }

  try {
    const parsedUrl = new URL(url);
    
    // Check if protocol is https or http
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Check if hostname is not empty
    if (!parsedUrl.hostname) {
      return false;
    }

    // Validate common file extensions for policy documents
    const validExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const pathname = parsedUrl.pathname.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext));
    
    // Allow URLs without extensions if they contain "policy" or common cloud storage patterns
    const hasValidPattern = 
      pathname.includes('policy') || 
      pathname.includes('document') ||
      parsedUrl.hostname.includes('s3.amazonaws.com') ||
      parsedUrl.hostname.includes('blob.core.windows.net') ||
      parsedUrl.hostname.includes('storage.googleapis.com');

    return hasValidExtension || hasValidPattern;
  } catch (error) {
    return false;
  }
}
