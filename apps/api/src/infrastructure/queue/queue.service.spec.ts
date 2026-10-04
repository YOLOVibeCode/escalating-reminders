import { Worker } from 'bullmq';

import { QueueService } from './queue.service';

jest.mock('bullmq', () => ({
  Queue: jest.fn(),
  QueueEvents: jest.fn(),
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn(), close: jest.fn() })),
}));

describe('QueueService job routing', () => {
  let service: QueueService;

  beforeEach(() => {
    (Worker as unknown as jest.Mock).mockClear();
    service = new QueueService({ get: jest.fn() } as never);
    // Stand-in for the Redis connection onModuleInit would open.
    (service as unknown as { connection: object }).connection = {};
  });

  it('runs one BullMQ worker per queue, however many job names it handles', async () => {
    await service.process('high-priority', 'reminder.trigger', jest.fn());
    await service.process('high-priority', 'escalation.advance', jest.fn());
    await service.process('default', 'notification.send', jest.fn());

    const queues = (Worker as unknown as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(queues).toEqual(['high-priority', 'default']);
  });

  it('routes each job to the handler for its name', async () => {
    const trigger = jest.fn().mockResolvedValue(undefined);
    const advance = jest.fn().mockResolvedValue(undefined);
    await service.process('high-priority', 'reminder.trigger', trigger);
    await service.process('high-priority', 'escalation.advance', advance);

    await service.dispatch('high-priority', 'escalation.advance', { reminderId: 'r1' });

    expect(advance).toHaveBeenCalledWith({ reminderId: 'r1' });
    expect(trigger).not.toHaveBeenCalled();
  });

  it('fails a job with no handler instead of completing it silently', async () => {
    await service.process('high-priority', 'reminder.trigger', jest.fn());

    await expect(service.dispatch('high-priority', 'escalation.advance', {})).rejects.toThrow(
      'No handler registered for high-priority:escalation.advance',
    );
  });
});
