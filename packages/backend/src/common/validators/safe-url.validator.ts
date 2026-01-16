import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom validator for safe URL validation
 * Checks for:
 * - Valid URL format
 * - Allowed protocols (https, http)
 * - No internal/private IP addresses
 * - No localhost references
 */
@ValidatorConstraint({ name: 'isSafeUrl', async: false })
export class IsSafeUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (!url) {
      return true; // Let @IsOptional handle empty values
    }

    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTPS and HTTP protocols
      const allowedProtocols = ['https:', 'http:'];
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        return false;
      }

      // Block internal/private IP addresses and localhost
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Block localhost variations
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('localhost.') ||
        hostname.endsWith('.localhost')
      ) {
        return false;
      }

      // Block private IP ranges (IPv4)
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
      const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const ipv4Match = hostname.match(ipv4Regex);
      
      if (ipv4Match) {
        const octets = ipv4Match.slice(1).map(Number);
        
        // Check if it's a valid IPv4 address
        if (octets.some(octet => octet > 255)) {
          return false;
        }
        
        // Block private ranges
        if (
          octets[0] === 10 || // 10.0.0.0/8
          (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || // 172.16.0.0/12
          (octets[0] === 192 && octets[1] === 168) || // 192.168.0.0/16
          (octets[0] === 169 && octets[1] === 254) // 169.254.0.0/16 (link-local)
        ) {
          return false;
        }
      }

      // Block internal domains
      const internalDomains = ['.local', '.internal', '.lan', '.intranet'];
      if (internalDomains.some(domain => hostname.endsWith(domain))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'URL must be a valid HTTPS/HTTP URL and cannot point to internal resources';
  }
}

/**
 * Decorator for safe URL validation
 * Use this instead of @IsUrl() for user-provided URLs that will be accessed by the server
 * 
 * @param validationOptions - Optional validation options
 * 
 * @example
 * ```typescript
 * export class UploadPoliciesDto {
 *   @IsOptional()
 *   @IsSafeUrl()
 *   glPolicyUrl?: string;
 * }
 * ```
 */
export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSafeUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsSafeUrlConstraint,
    });
  };
}
