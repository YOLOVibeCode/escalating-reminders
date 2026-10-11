import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import {
  TrustedContactService,
  type IAcceptOptInInput,
  type ITrustedContactOptInView,
} from './trusted-contact.service';

/**
 * Public, no login: the page a trusted contact opens from the link the user sent them. The
 * token is the only credential; it names one contact and can be withdrawn by the user.
 */
@ApiTags('trusted-contacts')
@Controller('public/trusted-contact-optin')
export class TrustedContactOptInController {
  constructor(private readonly trustedContactService: TrustedContactService) {}

  @Get(':token')
  @ApiOperation({ summary: 'What a trusted contact sees before opting in to texts' })
  async get(@Param('token') token: string): Promise<ITrustedContactOptInView> {
    return this.trustedContactService.getOptIn(token);
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'A trusted contact opts in to escalation texts' })
  async accept(
    @Param('token') token: string,
    @Body() body: IAcceptOptInInput,
    @Req() req: Request,
  ): Promise<{ status: 'OPTED_IN' }> {
    const userAgent = req.headers['user-agent'];
    const context: { ip?: string; userAgent?: string } = {};
    // Behind Railway's proxy req.ip is the proxy; the first X-Forwarded-For hop is the person.
    const forwarded = req.headers['x-forwarded-for'];
    const firstHop = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
    const ip = firstHop !== undefined && firstHop !== '' ? firstHop : req.ip;
    if (ip !== undefined && ip !== '') context.ip = ip;
    if (typeof userAgent === 'string') context.userAgent = userAgent;
    return this.trustedContactService.acceptOptIn(token, body, context);
  }
}
