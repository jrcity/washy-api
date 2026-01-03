/**
 * Token Utility
 * JWT token generation and verification
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { CONFIGS } from '@/constants/configs.constant';
import { EUSERS_ROLE } from '@/constants/enums.constant';

export interface TokenPayload {
  id: Types.ObjectId | string;
  role: EUSERS_ROLE;
  type?: 'access' | 'refresh';
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

class TokenService {
  private readonly secret: string;
  private readonly refreshSecret: string;
  private readonly expiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.secret = CONFIGS.JWT.SECRET;
    this.refreshSecret = CONFIGS.JWT.REFRESH_SECRET;
    this.expiresIn = CONFIGS.JWT.EXPIRES_IN;
    this.refreshExpiresIn = CONFIGS.JWT.REFRESH_EXPIRES_IN;
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: this.expiresIn as any };
    return jwt.sign(
      { ...payload, type: 'access' },
      this.secret,
      options
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: this.refreshExpiresIn as any };
    return jwt.sign(
      { ...payload, type: 'refresh' },
      this.refreshSecret,
      options
    );
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): DecodedToken {
    try {
      return jwt.verify(token, this.secret) as DecodedToken;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): DecodedToken {
    try {
      return jwt.verify(token, this.refreshSecret) as DecodedToken;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification
   */
  decodeToken(token: string): DecodedToken | null {
    return jwt.decode(token) as DecodedToken | null;
  }

  /**
   * Check if token is expired
   */
  isExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;
    return Date.now() >= decoded.exp * 1000;
  }
}

export const tokenService = new TokenService();
export default tokenService;
