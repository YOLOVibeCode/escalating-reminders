import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IAgentExecutor, NotificationPayload, AgentCommand, SendResult, CommandResult } from '@er/interfaces';
import type { UserAgentSubscription } from '@er/types';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import net from 'node:net';
import { randomUUID } from 'node:crypto';

/**
 * Email agent executor.
 * Sends notifications via SMTP (MailHog in local dev).
 */
@Injectable()
export class EmailAgentExecutor implements IAgentExecutor {
  readonly agentType = 'email';
  private readonly logger = new Logger(EmailAgentExecutor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private createTransport() {
    const host = this.configService.get<string>('SMTP_HOST') || 'localhost';
    const portRaw = this.configService.get<string>('SMTP_PORT') || '3811';
    const port = Number(portRaw);
    const from = this.configService.get<string>('SMTP_FROM') || 'no-reply@escalating-reminders.local';

    return {
      host,
      port,
      from,
    };
  }

  private async sendSmtpMail(input: {
    host: string;
    port: number;
    from: string;
    to: string;
    subject: string;
    text: string;
  }): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const socket = net.connect({ host: input.host, port: input.port });
      socket.setTimeout(10000);

      let buffer = '';
      const write = (line: string) => socket.write(`${line}\r\n`);

      const expectCode = (code: string) =>
        new Promise<void>((res, rej) => {
          const onData = (data: Buffer) => {
            buffer += data.toString('utf8');
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';
            for (const l of lines) {
              if (!l.trim()) continue;
              if (l.startsWith(code)) {
                socket.off('data', onData);
                res();
                return;
              }
              // Any 4xx/5xx should fail fast.
              if (/^[45]\d\d/.test(l)) {
                socket.off('data', onData);
                rej(new Error(`SMTP error: ${l}`));
                return;
              }
            }
          };
          socket.on('data', onData);
        });

      socket.on('error', reject);
      socket.on('timeout', () => reject(new Error('SMTP timeout')));

      (async () => {
        try {
          await expectCode('220');
          write('HELO localhost');
          await expectCode('250');
          write(`MAIL FROM:<${input.from}>`);
          await expectCode('250');
          write(`RCPT TO:<${input.to}>`);
          await expectCode('250');
          write('DATA');
          await expectCode('354');

          const message =
            `From: ${input.from}\r\n` +
            `To: ${input.to}\r\n` +
            `Subject: ${input.subject}\r\n` +
            `Content-Type: text/plain; charset=utf-8\r\n` +
            `\r\n` +
            `${input.text}\r\n`;

          socket.write(message);
          write('.');
          await expectCode('250');
          write('QUIT');
          socket.end();
          resolve();
        } catch (e) {
          socket.destroy();
          reject(e);
        }
      })();
    });
  }

  async send(subscription: UserAgentSubscription, payload: NotificationPayload): Promise<SendResult> {
    const startedAt = Date.now();
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: subscription.userId },
        select: { email: true },
      });

      const to = user?.email;
      if (!to) {
        return { success: false, error: 'User email not found' };
      }

      const { host, port, from } = this.createTransport();

      const subject = `Escalating Reminders: ${payload.title}`;
      const text =
        `${payload.message}\n\n` +
        `Reminder ID: ${payload.reminderId}\n` +
        `Tier: ${payload.escalationTier}\n` +
        `Actions: ${payload.actions.join(', ')}\n`;

      const messageId = randomUUID();
      await this.sendSmtpMail({ host, port, from, to, subject, text });

      this.logger.log(`Email sent to ${to} in ${Date.now() - startedAt}ms`);
      return {
        success: true,
        messageId,
        deliveredAt: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Email send failed: ${message}`);
      return { success: false, error: message };
    }
  }

  async handleCommand(
    _subscription: UserAgentSubscription,
    _command: AgentCommand,
  ): Promise<CommandResult> {
    // Email commands are typically handled via signed links/web UI, not inbound SMTP.
    return { success: false, error: 'Email agent does not support inbound commands' };
  }

  async test(subscription: UserAgentSubscription): Promise<{ success: boolean; message: string; deliveryTime?: number }> {
    const startedAt = Date.now();
    const payload: NotificationPayload = {
      notificationId: `test_${Date.now()}`,
      userId: subscription.userId,
      reminderId: 'test',
      title: 'Test Email Notification',
      message: 'This is a test email from Escalating Reminders.',
      escalationTier: 0,
      importance: 'LOW',
      actions: [],
      metadata: { test: true },
    };

    const result = await this.send(subscription, payload);
    const deliveryTime = Date.now() - startedAt;
    return result.success
      ? { success: true, message: 'Test email sent successfully', deliveryTime }
      : { success: false, message: result.error || 'Test email failed', deliveryTime };
  }
}

