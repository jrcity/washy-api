/**
 * OTP Utility
 * Generate and verify OTP codes for delivery confirmation
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import crypto from 'crypto';

class OTPService {
  private readonly otpLength: number;
  private readonly expiryMinutes: number;

  constructor(otpLength: number = 4, expiryMinutes: number = 30) {
    this.otpLength = otpLength;
    this.expiryMinutes = expiryMinutes;
  }

  /**
   * Generate a numeric OTP
   */
  generate(): string {
    const digits = '0123456789';
    let otp = '';
    
    const randomBytes = crypto.randomBytes(this.otpLength);
    for (let i = 0; i < this.otpLength; i++) {
      otp += digits[randomBytes[i]! % 10];
    }
    
    return otp;
  }

  /**
   * Generate an alphanumeric code
   */
  generateAlphanumeric(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      code += chars[randomBytes[i]! % chars.length];
    }
    
    return code;
  }

  /**
   * Generate order number
   */
  generateOrderNumber(prefix: string = 'CF'): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = this.generateAlphanumeric(4);
    return `${prefix}-${dateStr}-${random}`;
  }

  /**
   * Calculate expiry time
   */
  getExpiryTime(minutes?: number): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + (minutes || this.expiryMinutes));
    return expiry;
  }

  /**
   * Check if OTP is expired
   */
  isExpired(expiryTime: Date): boolean {
    return new Date() > new Date(expiryTime);
  }

  /**
   * Hash OTP for secure storage
   */
  hash(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Verify OTP against hash
   */
  verify(otp: string, hashedOtp: string): boolean {
    return this.hash(otp) === hashedOtp;
  }
}

export const otpService = new OTPService();
export default otpService;
