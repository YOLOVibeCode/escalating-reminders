import { ReminderTriggerJob } from '../jobs/reminder-trigger-job';

describe('ReminderTriggerJob', () => {
  const dueAt = new Date('2026-10-04T16:08:00.000Z');
  const reminder = {
    id: 'reminder_1',
    userId: 'user_1',
    title: 'Take meds',
    importance: 'HIGH',
    escalationProfileId: 'profile_1',
    status: 'SNOOZED',
    nextTriggerAt: dueAt,
  };

  const repository = { findDueForTrigger: jest.fn(), update: jest.fn() };
  const queue = { add: jest.fn() };
  const job = new ReminderTriggerJob(repository as never, queue as never);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findDueForTrigger.mockResolvedValue([reminder]);
  });

  it('consumes the occurrence before queueing it, so the next pass does not fire it again', async () => {
    const order: string[] = [];
    repository.update.mockImplementation(async () => order.push('update'));
    queue.add.mockImplementation(async () => order.push('queue'));

    await job.execute();

    expect(repository.update).toHaveBeenCalledWith('reminder_1', {
      status: 'ACTIVE',
      nextTriggerAt: null,
      lastTriggeredAt: expect.any(Date),
    });
    expect(order).toEqual(['update', 'queue']);
  });

  it('puts the occurrence back when queueing fails', async () => {
    queue.add.mockRejectedValue(new Error('redis down'));

    await expect(job.execute()).rejects.toThrow('redis down');

    expect(repository.update).toHaveBeenLastCalledWith('reminder_1', {
      status: 'SNOOZED',
      nextTriggerAt: dueAt,
    });
  });
});
