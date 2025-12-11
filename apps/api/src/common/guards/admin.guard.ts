import { Injectable, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import type { IAdminAuthorizationService } from '@er/interfaces';
import { ERROR_CODES } from '@er/constants';

/**
 * Admin guard.
 * Extends JwtAuthGuard to verify user is an admin.
 * Protects admin routes requiring admin access.
 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  constructor(
    @Inject('IAdminAuthorizationService')
    private readonly authorizationService: IAdminAuthorizationService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    // First verify JWT token
    const jwtValid = await super.canActivate(context);
    if (!jwtValid) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub; // From JWT payload

    if (!userId) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_FORBIDDEN,
        message: 'User ID not found in token',
      });
    }

    // Verify admin access
    try {
      const admin = await this.authorizationService.verifyAdminAccess(userId);
      // Replace user with AdminUser in request
      request.user = admin;
      return true;
    } catch (error) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_FORBIDDEN,
        message: 'Admin access required',
      });
    }
  }

  override handleRequest(err: unknown, user: unknown, info: unknown): any {
    if (err || !user) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_FORBIDDEN,
        message: 'Admin access required',
      });
    }
    return user;
  }
}
