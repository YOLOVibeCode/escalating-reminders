import { ERROR_CODES, ERROR_HTTP_STATUS } from '../src/error-codes';

describe('ErrorCodes', () => {
  describe('ERROR_CODES', () => {
    it('should have all error codes defined', () => {
      expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe('AUTH_INVALID_CREDENTIALS');
      expect(ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
      expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND');
      expect(ERROR_CODES.QUOTA_EXCEEDED).toBe('QUOTA_EXCEEDED');
    });
  });

  describe('ERROR_HTTP_STATUS', () => {
    it('should map all error codes to HTTP status codes', () => {
      expect(ERROR_HTTP_STATUS[ERROR_CODES.AUTH_UNAUTHORIZED]).toBe(401);
      expect(ERROR_HTTP_STATUS[ERROR_CODES.VALIDATION_FAILED]).toBe(400);
      expect(ERROR_HTTP_STATUS[ERROR_CODES.RESOURCE_NOT_FOUND]).toBe(404);
      expect(ERROR_HTTP_STATUS[ERROR_CODES.QUOTA_EXCEEDED]).toBe(422);
      expect(ERROR_HTTP_STATUS[ERROR_CODES.RATE_LIMIT_EXCEEDED]).toBe(429);
      expect(ERROR_HTTP_STATUS[ERROR_CODES.INTERNAL_ERROR]).toBe(500);
    });
  });
});

