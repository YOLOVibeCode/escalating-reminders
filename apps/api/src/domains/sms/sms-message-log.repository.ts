import { Injectable } from '@nestjs/common';
import type { SmsMessageDirection, SmsMessageLog } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class SmsMessageLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    phone: string;
    body: string;
    direction?: SmsMessageDirection;
    relayHttpStatus?: number;
    relayErrorCode?: number;
    relayErrorMessage?: string;
    twilioMessageSid?: string;
    messageStatus?: string;
    errorCode?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SmsMessageLog> {
    const data: Record<string, unknown> = {
      phone: input.phone,
      body: input.body,
      direction: input.direction ?? 'OUTBOUND',
      metadata: (input.metadata ?? {}) as object,
    };
    if (input.relayHttpStatus !== undefined) data.relayHttpStatus = input.relayHttpStatus;
    if (input.relayErrorCode !== undefined) data.relayErrorCode = input.relayErrorCode;
    if (input.relayErrorMessage !== undefined) data.relayErrorMessage = input.relayErrorMessage;
    if (input.twilioMessageSid !== undefined) data.twilioMessageSid = input.twilioMessageSid;
    if (input.messageStatus !== undefined) data.messageStatus = input.messageStatus;
    if (input.errorCode !== undefined) data.errorCode = input.errorCode;

    return this.prisma.smsMessageLog.create({
      data: data as Parameters<typeof this.prisma.smsMessageLog.create>[0]['data'],
    });
  }

  async updateByMessageSid(
    messageSid: string,
    data: { messageStatus?: string; errorCode?: string },
  ): Promise<SmsMessageLog | null> {
    const existing = await this.prisma.smsMessageLog.findUnique({
      where: { twilioMessageSid: messageSid },
    });
    if (!existing) {
      return null;
    }
    return this.prisma.smsMessageLog.update({
      where: { id: existing.id },
      data: {
        messageStatus: data.messageStatus ?? existing.messageStatus,
        errorCode: data.errorCode ?? existing.errorCode,
      },
    });
  }
}
