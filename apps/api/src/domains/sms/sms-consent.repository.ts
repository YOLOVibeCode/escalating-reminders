import { Injectable } from '@nestjs/common';
import type { SmsConsent } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class SmsConsentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhoneAndPurpose(phone: string, purpose: string): Promise<SmsConsent | null> {
    return this.prisma.smsConsent.findUnique({
      where: { phone_purpose: { phone, purpose } },
    });
  }

  async hasActiveConsent(phone: string, purpose: string): Promise<boolean> {
    const row = await this.findByPhoneAndPurpose(phone, purpose);
    return Boolean(row?.consentedAt && !row.revokedAt);
  }

  async recordOptIn(input: {
    phone: string;
    purpose: string;
    consentTextVersion: string;
    source: string;
    ip?: string;
    userAgent?: string;
    consentedAt?: Date;
  }): Promise<SmsConsent> {
    const now = input.consentedAt ?? new Date();
    const base: Record<string, unknown> = {
      phone: input.phone,
      purpose: input.purpose,
      consentTextVersion: input.consentTextVersion,
      source: input.source,
      consentedAt: now,
      revokedAt: null,
    };
    if (input.ip !== undefined) base.ip = input.ip;
    if (input.userAgent !== undefined) base.userAgent = input.userAgent;

    const update: Record<string, unknown> = {
      consentTextVersion: input.consentTextVersion,
      source: input.source,
      consentedAt: now,
      revokedAt: null,
    };
    if (input.ip !== undefined) update.ip = input.ip;
    if (input.userAgent !== undefined) update.userAgent = input.userAgent;

    return this.prisma.smsConsent.upsert({
      where: { phone_purpose: { phone: input.phone, purpose: input.purpose } },
      create: base as Parameters<typeof this.prisma.smsConsent.upsert>[0]['create'],
      update: update as Parameters<typeof this.prisma.smsConsent.upsert>[0]['update'],
    });
  }

  async recordOptOut(phone: string, purpose: string): Promise<void> {
    const existing = await this.findByPhoneAndPurpose(phone, purpose);
    const now = new Date();
    if (existing) {
      await this.prisma.smsConsent.update({
        where: { id: existing.id },
        data: { revokedAt: now },
      });
      return;
    }
    await this.prisma.smsConsent.create({
      data: {
        phone,
        purpose,
        consentTextVersion: '',
        source: 'keyword-stop',
        consentedAt: null,
        revokedAt: now,
      },
    });
  }

  async clearOptOut(phone: string, purpose: string): Promise<void> {
    const existing = await this.findByPhoneAndPurpose(phone, purpose);
    if (!existing) {
      return;
    }
    await this.prisma.smsConsent.update({
      where: { id: existing.id },
      data: { revokedAt: null },
    });
  }

  async recordOptOutAllPurposes(phone: string): Promise<void> {
    const rows = await this.prisma.smsConsent.findMany({ where: { phone } });
    const now = new Date();
    await Promise.all(
      rows.map((row) =>
        this.prisma.smsConsent.update({
          where: { id: row.id },
          data: { revokedAt: now },
        }),
      ),
    );
  }
}
