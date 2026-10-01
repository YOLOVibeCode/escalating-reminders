import { Injectable } from '@nestjs/common';
import { TrustedContactRepository } from './trusted-contact.repository';
import { NotFoundError, ForbiddenError } from '../../common/exceptions';
import { parseToE164 } from '../sms/phone.util';
import { GuardedSmsSendService } from '../sms/guarded-sms-send.service';
import { buildTrustedContactConfirmationBody } from '../sms/sms-compliance.constants';
import type { TrustedContact } from '@er/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export type CreateTrustedContactInput = {
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  notifyViaSms?: boolean;
};

@Injectable()
export class TrustedContactService {
  constructor(
    private readonly repository: TrustedContactRepository,
    private readonly guardedSmsSend: GuardedSmsSendService,
    private readonly prisma: PrismaService,
  ) {}

  async list(userId: string): Promise<TrustedContact[]> {
    return this.repository.findByUserId(userId);
  }

  async create(userId: string, input: CreateTrustedContactInput): Promise<TrustedContact> {
    const phone = input.phone ? parseToE164(input.phone) : null;
    const contact = await this.repository.create({
      userId,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone,
      relationship: input.relationship.trim(),
      notificationPreferences: {
        email: true,
        sms: Boolean(input.notifyViaSms && phone),
      },
    });

    if (phone) {
      await this.sendConfirmationSms(userId, phone);
    }

    return contact;
  }

  async update(
    userId: string,
    id: string,
    input: Partial<CreateTrustedContactInput>,
  ): Promise<TrustedContact> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Trusted contact ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Not allowed to update this contact');
    }

    const previousPhone = existing.phone;
    const phone =
      input.phone !== undefined
        ? input.phone
          ? parseToE164(input.phone)
          : null
        : existing.phone;

    const updatePayload: Partial<{
      name: string;
      email: string | null;
      phone: string | null;
      relationship: string;
      notificationPreferences: { email: boolean; sms: boolean };
    }> = {};

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.email !== undefined) updatePayload.email = input.email?.trim() || null;
    if (input.phone !== undefined) updatePayload.phone = phone;
    if (input.relationship !== undefined) updatePayload.relationship = input.relationship.trim();
    if (input.notifyViaSms !== undefined || input.phone !== undefined) {
      updatePayload.notificationPreferences = {
        email: true,
        sms: Boolean(
          (input.notifyViaSms ?? (existing.notificationPreferences as { sms?: boolean }).sms) &&
            phone,
        ),
      };
    }

    const updated = await this.repository.update(id, updatePayload);

    if (phone && phone !== previousPhone) {
      await this.sendConfirmationSms(userId, phone);
    }

    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Trusted contact ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Not allowed to delete this contact');
    }
    await this.repository.delete(id);
  }

  private async sendConfirmationSms(userId: string, phone: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const who = user?.profile?.displayName || user?.email || 'Someone';
    await this.guardedSmsSend.send({
      phone,
      body: buildTrustedContactConfirmationBody(who),
      allowWithoutConsent: 'double-opt-in-confirmation',
      metadata: { type: 'trusted-contact-confirmation', userId },
    });
  }
}
