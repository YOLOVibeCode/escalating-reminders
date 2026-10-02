import { Test } from '@nestjs/testing';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GuardedSmsSendService } from '../../sms/guarded-sms-send.service';
import { TrustedContactRepository } from '../trusted-contact.repository';
import { TrustedContactService } from '../trusted-contact.service';

describe('TrustedContactService', () => {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByUserId: jest.fn(),
  };
  const guardedSmsSend = { send: jest.fn() };
  const prisma = {
    user: { findUnique: jest.fn() },
  };

  let service: TrustedContactService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        TrustedContactService,
        { provide: TrustedContactRepository, useValue: repository },
        { provide: GuardedSmsSendService, useValue: guardedSmsSend },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(TrustedContactService);
  });

  it('sends confirmation SMS when creating contact with phone', async () => {
    repository.create.mockResolvedValue({
      id: 'tc1',
      userId: 'user_1',
      phone: '+15125550199',
    });
    prisma.user.findUnique.mockResolvedValue({
      email: 'owner@example.com',
      profile: { displayName: 'Owner' },
    });
    guardedSmsSend.send.mockResolvedValue({});

    await service.create('user_1', {
      name: 'Contact',
      phone: '+15125550199',
      relationship: 'friend',
      notifyViaSms: true,
    });

    expect(guardedSmsSend.send).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+15125550199',
        allowWithoutConsent: 'double-opt-in-confirmation',
      }),
    );
    expect(guardedSmsSend.send).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Owner') as string,
      }),
    );
  });
});
