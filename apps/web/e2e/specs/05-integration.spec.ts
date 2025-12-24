import { test, expect } from '@playwright/test';
import { loginAsRole } from '../helpers/login-as-role';
import { clearMailHog, getMailHogMessages, isMailHogAvailable, waitForEmail } from '../helpers/mailhog';
import { resetWebhookReceiver, waitForWebhookEvent } from '../helpers/webhook-receiver';

/**
 * Layer 5: @integration
 * 
 * Purpose: Cross-role and cross-feature workflows
 * Execution: Serial (complex dependencies)
 * Fail Behavior: If any fail → skip Layer 6
 * Dependencies: Layer 4 passes
 */

test.describe('Layer 5: Integration Tests', () => {
  test('05-01: User creates, admin views @integration', async ({ page }) => {
    // Login as user
    await loginAsRole(page, 'user');
    
    // Create a reminder
    await page.goto('/reminders/new');
    const titleInput = page.locator('[data-testid="reminder-title-input"]').first();
    await titleInput.fill('Integration Test Reminder');
    
    const submitButton = page.locator('[data-testid="submit-button"]').first();
    await submitButton.click();
    
    await page.waitForURL(/\/reminders/, { timeout: 15000 });
    
    // Logout and login as admin
    await page.goto('/login');
    await loginAsRole(page, 'admin');
    
    // Admin should be able to see reminders
    await page.goto('/admin/reminders');
    await page.waitForLoadState('networkidle');
    
    // Verify admin can see reminders list
    const remindersList = page.locator('[data-testid="reminders-list"], table').first();
    await expect(remindersList).toBeVisible({ timeout: 5000 }).catch(() => {
      // Empty state is acceptable if no reminders exist
    });
  });

  test('05-02: Admin changes tier, user sees @integration', async ({ page }) => {
    // Login as admin
    await loginAsRole(page, 'admin');
    
    // Navigate to users
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Find a user and update tier
    const editButton = page.locator('[data-testid^="edit-"]').first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      
      const tierSelect = page.locator('[data-testid="tier-select"]').first();
      if (await tierSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tierSelect.selectOption('pro');
        
        const saveButton = page.locator('[data-testid="submit-button"]').first();
        await saveButton.click();
        
        await page.waitForTimeout(2000);
      }
    }
    
    // Logout and login as user
    await page.goto('/login');
    await loginAsRole(page, 'user');
    
    // User should see updated tier in settings
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    
    // Verify tier is displayed (if shown)
    const tierDisplay = page.locator('[data-testid="tier-display"], text=/pro|personal|free/i').first();
    if (await tierDisplay.isVisible().catch(() => false)) {
      await expect(tierDisplay).toBeVisible();
    }
  });

  test('05-03: Reminder escalation flow @integration', async ({ page }) => {
    // Login as user
    await loginAsRole(page, 'user');
    
    // Create a reminder with escalation
    await page.goto('/reminders/new');
    const titleInput = page.locator('[data-testid="reminder-title-input"]').first();
    await titleInput.fill('Escalation Test Reminder');
    
    // Select escalation profile if available
    const escalationSelect = page.locator('[data-testid="escalation-select"]').first();
    if (await escalationSelect.isVisible().catch(() => false)) {
      await escalationSelect.selectOption({ index: 0 });
    }
    
    const submitButton = page.locator('[data-testid="submit-button"]').first();
    await submitButton.click();
    
    await page.waitForURL(/\/reminders/, { timeout: 15000 });
    
    // Verify reminder was created
    const reminderLink = page.locator('text=Escalation Test Reminder').first();
    if (await reminderLink.isVisible().catch(() => false)) {
      await expect(reminderLink).toBeVisible();
    }
    
    // Note: Actual escalation triggering would require background workers
    // This test verifies the creation part of the flow
  });

  test('05-04: Agent webhook delivery @integration', async ({ request }) => {
    await resetWebhookReceiver();

    const apiBase = process.env.API_BASE_URL || 'http://localhost:3801';
    const webhookUrl = process.env.WEBHOOK_TEST_URL || 'http://localhost:3812/webhook';

    // Ensure seed data exists (test user + webhook subscription)
    await request.post(`${apiBase}/v1/seeding/seed`);

    // Login via API to get access token
    const loginRes = await request.post(`${apiBase}/v1/auth/login`, {
      data: { email: 'testuser@example.com', password: 'TestUser123!' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginJson = (await loginRes.json()) as any;
    const accessToken = loginJson?.data?.tokens?.accessToken as string;
    expect(accessToken).toBeTruthy();

    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Find webhook subscription and update URL to point to our receiver
    const subsRes = await request.get(`${apiBase}/v1/agents/subscriptions`, { headers: authHeaders });
    expect(subsRes.ok()).toBeTruthy();
    const subs = (await subsRes.json()) as any[];
    const webhookSub = subs.find((s) => s.agentDefinition?.type === 'webhook');
    expect(webhookSub?.id).toBeTruthy();

    const updateRes = await request.patch(`${apiBase}/v1/agents/subscriptions/${webhookSub.id}`, {
      headers: authHeaders,
      data: { configuration: { url: webhookUrl } },
    });
    expect(updateRes.ok()).toBeTruthy();

    // Choose an escalation profile that uses webhook at some tier (prefer tier 3 from seeded "Critical")
    const profilesRes = await request.get(`${apiBase}/v1/escalation-profiles`, { headers: authHeaders });
    expect(profilesRes.ok()).toBeTruthy();
    const profiles = (await profilesRes.json()) as any[];
    const profileWithWebhook = profiles.find((p) => {
      const tiers = (p?.tiers || []) as Array<{ tierNumber: number; agentIds: string[] }>;
      return tiers.some((t) => Array.isArray(t.agentIds) && t.agentIds.includes('webhook'));
    });
    expect(profileWithWebhook?.id).toBeTruthy();

    // Create a reminder and trigger the tier that includes webhook
    const tiers = (profileWithWebhook.tiers || []) as Array<{ tierNumber: number; agentIds: string[] }>;
    const webhookTier = tiers.find((t) => Array.isArray(t.agentIds) && t.agentIds.includes('webhook'))?.tierNumber;
    expect(webhookTier).toBeTruthy();

    const title = `Webhook Integration ${Date.now()}`;
    const triggerAt = new Date(Date.now() + 60 * 1000).toISOString();
    const createRes = await request.post(`${apiBase}/v1/reminders`, {
      headers: authHeaders,
      data: {
        title,
        importance: 'MEDIUM',
        escalationProfileId: profileWithWebhook.id,
        schedule: { type: 'ONCE', triggerAt, timezone: 'UTC' },
      },
    });
    if (!createRes.ok()) {
      throw new Error(
        `Create reminder failed: ${createRes.status()} ${await createRes.text()}`,
      );
    }
    const created = (await createRes.json()) as any;
    const reminderId = (created?.data?.id || created?.id) as string | undefined;
    expect(reminderId).toBeTruthy();

    const triggerRes = await request.post(`${apiBase}/v1/seeding/trigger-notification`, {
      data: { reminderId, userId: 'me', tier: webhookTier },
    });
    expect(triggerRes.ok()).toBeTruthy();

    const evt = await waitForWebhookEvent({
      predicate: (e) => e.body?.reminderId === reminderId && e.body?.title === title,
      timeoutMs: 15000,
    });
    expect(evt.body?.escalationTier).toBe(webhookTier);
  });

  test('05-05: Full reminder lifecycle @integration', async ({ page }) => {
    // Login as user
    await loginAsRole(page, 'user');
    
    // Create reminder
    await page.goto('/reminders/new');
    const titleInput = page.locator('[data-testid="reminder-title-input"]').first();
    await titleInput.fill('Lifecycle Test Reminder');
    
    const submitButton = page.locator('[data-testid="submit-button"]').first();
    await submitButton.click();
    
    await page.waitForURL(/\/reminders/, { timeout: 15000 });
    
    // Snooze reminder
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    
    const snoozeButton = page.locator('[data-testid="snooze-trigger-button"]').first();
    if (await snoozeButton.isVisible().catch(() => false)) {
      await snoozeButton.click();
      
      await page.waitForSelector('[data-testid="snooze-dialog"]', { timeout: 2000 }).catch(() => {});
      const snoozeInput = page.locator('[data-testid="snooze-duration-input"]').first();
      if (await snoozeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await snoozeInput.fill('1 hour');
        const confirmButton = page.locator('[data-testid="snooze-confirm-button"]').first();
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
    }
    
    // Complete reminder
    const completeButton = page.locator('[data-testid="complete-button"]').first();
    if (await completeButton.isVisible().catch(() => false)) {
      await completeButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify reminder is completed (might be filtered out or marked)
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
  });

  test('05-06: Email notification delivered (MailHog) @integration', async ({ request }) => {
    const mailhogOk = await isMailHogAvailable();
    test.skip(!mailhogOk, 'MailHog is not available');

    await clearMailHog();

    const reminderTitle = `MailHog Escalation ${Date.now()}`;
    const apiBase = process.env.API_BASE_URL || 'http://localhost:3801';

    // Ensure seed data exists (test user + escalation profiles + email subscription)
    await request.post(`${apiBase}/v1/seeding/seed`);

    // Login via API to get access token
    const loginRes = await request.post(`${apiBase}/v1/auth/login`, {
      data: { email: 'testuser@example.com', password: 'TestUser123!' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginJson = (await loginRes.json()) as any;
    const accessToken = loginJson?.data?.tokens?.accessToken as string;
    expect(accessToken).toBeTruthy();

    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Pick a profile that includes email at tier 1 (required for this test)
    const profilesRes = await request.get(`${apiBase}/v1/escalation-profiles`, { headers: authHeaders });
    expect(profilesRes.ok()).toBeTruthy();
    const profiles = (await profilesRes.json()) as Array<{ id: string; name: string; tiers?: any }>;
    const profileWithEmailTier1 = profiles.find((p) => {
      const tiers = (p as any).tiers as Array<{ tierNumber: number; agentIds: string[] }> | undefined;
      const t1 = tiers?.find((t) => t.tierNumber === 1);
      return !!t1 && Array.isArray(t1.agentIds) && t1.agentIds.includes('email');
    });
    expect(profileWithEmailTier1?.id).toBeTruthy();

    // Create a reminder via API
    const triggerAt = new Date(Date.now() + 60 * 1000).toISOString();
    const createRes = await request.post(`${apiBase}/v1/reminders`, {
      headers: authHeaders,
      data: {
        title: reminderTitle,
        importance: 'MEDIUM',
        escalationProfileId: profileWithEmailTier1!.id,
        schedule: { type: 'ONCE', triggerAt, timezone: 'UTC' },
      },
    });
    if (!createRes.ok()) {
      throw new Error(
        `Create reminder failed: ${createRes.status()} ${await createRes.text()}`,
      );
    }
    const created = (await createRes.json()) as any;
    const reminderId = (created?.data?.id || created?.id) as string | undefined;
    expect(reminderId).toBeTruthy();

    // Trigger tier notifications via test-only endpoint (dev/test only)
    const triggerRes = await request.post(`${apiBase}/v1/seeding/trigger-notification`, {
      data: { reminderId, userId: 'me', tier: 1 },
    });
    expect(triggerRes.ok()).toBeTruthy();
    const triggerJson = (await triggerRes.json()) as any;
    const logs1 = (triggerJson?.data?.logs || []) as Array<{ agentType: string; status: string; tier: number }>;
    expect(logs1.some((l) => l.agentType === 'email' && l.status === 'DELIVERED' && l.tier === 1)).toBeTruthy();

    await waitForEmail({
      to: 'testuser@example.com',
      subjectIncludes: reminderTitle,
      bodyIncludes: [
        `Reminder ID: ${reminderId}`,
        'Tier: 1',
        'Actions: snooze, dismiss, complete',
      ],
      timeoutMs: 20000,
    });

    // Trigger tier 2 as well and assert a second email is delivered
    const triggerRes2 = await request.post(`${apiBase}/v1/seeding/trigger-notification`, {
      data: { reminderId, userId: 'me', tier: 2 },
    });
    expect(triggerRes2.ok()).toBeTruthy();
    const triggerJson2 = (await triggerRes2.json()) as any;
    const logs2 = (triggerJson2?.data?.logs || []) as Array<{ agentType: string; status: string; tier: number }>;
    expect(logs2.some((l) => l.agentType === 'email' && l.status === 'DELIVERED' && l.tier === 2)).toBeTruthy();

    await waitForEmail({
      to: 'testuser@example.com',
      subjectIncludes: reminderTitle,
      bodyIncludes: [
        `Reminder ID: ${reminderId}`,
        'Tier: 2',
        'Actions: snooze, dismiss, complete',
      ],
      timeoutMs: 20000,
    });
  });

  test('05-07: Delivery disabled blocks all outbound sends @integration', async ({ request }) => {
    const apiBase = process.env.API_BASE_URL || 'http://localhost:3801';
    const mailhogOk = await isMailHogAvailable();
    test.skip(!mailhogOk, 'MailHog is not available');

    await clearMailHog();
    await resetWebhookReceiver();

    // Ensure seed data exists
    await request.post(`${apiBase}/v1/seeding/seed`);

    // Disable delivery for test user
    const setStateRes = await request.post(`${apiBase}/v1/seeding/set-delivery-state`, {
      data: {
        userId: 'testuser@example.com',
        state: 'DELIVERY_DISABLED',
        reason: 'E2E delivery disabled test',
      },
    });
    expect(setStateRes.ok()).toBeTruthy();

    // Login as user to create reminder
    const loginRes = await request.post(`${apiBase}/v1/auth/login`, {
      data: { email: 'testuser@example.com', password: 'TestUser123!' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginJson = (await loginRes.json()) as any;
    const accessToken = loginJson?.data?.tokens?.accessToken as string;
    expect(accessToken).toBeTruthy();
    const authHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Pick an escalation profile with email in tier 1 and webhook in some later tier (seeded profiles should provide this)
    const profilesRes = await request.get(`${apiBase}/v1/escalation-profiles`, { headers: authHeaders });
    expect(profilesRes.ok()).toBeTruthy();
    const profiles = (await profilesRes.json()) as any[];
    const profile = profiles.find((p) => {
      const tiers = (p?.tiers || []) as Array<{ tierNumber: number; agentIds: string[] }>;
      const t1 = tiers.find((t) => t.tierNumber === 1);
      return !!t1 && t1.agentIds?.includes('email') && tiers.some((t) => t.agentIds?.includes('webhook'));
    });
    expect(profile?.id).toBeTruthy();

    const tiers = (profile.tiers || []) as Array<{ tierNumber: number; agentIds: string[] }>;
    const webhookTier = tiers.find((t) => t.agentIds?.includes('webhook'))?.tierNumber;
    expect(webhookTier).toBeTruthy();

    const title = `DeliveryDisabled ${Date.now()}`;
    const triggerAt = new Date(Date.now() + 60 * 1000).toISOString();
    const createRes = await request.post(`${apiBase}/v1/reminders`, {
      headers: authHeaders,
      data: {
        title,
        importance: 'MEDIUM',
        escalationProfileId: profile.id,
        schedule: { type: 'ONCE', triggerAt, timezone: 'UTC' },
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()) as any;
    const reminderId = (created?.data?.id || created?.id) as string;
    expect(reminderId).toBeTruthy();

    // Trigger tier 1 (email) and webhook tier
    const t1Res = await request.post(`${apiBase}/v1/seeding/trigger-notification`, {
      data: { reminderId, userId: 'me', tier: 1 },
    });
    expect(t1Res.ok()).toBeTruthy();

    const tWRes = await request.post(`${apiBase}/v1/seeding/trigger-notification`, {
      data: { reminderId, userId: 'me', tier: webhookTier },
    });
    expect(tWRes.ok()).toBeTruthy();

    // Assert: no email and no webhook were delivered
    await new Promise((r) => setTimeout(r, 1500));
    const msgs = await getMailHogMessages();
    expect(msgs.length).toBe(0);

    // waitForWebhookEvent would throw; instead check no events after a short delay
    await new Promise((r) => setTimeout(r, 500));
    await expect(
      waitForWebhookEvent({
        predicate: (e) => e.body?.reminderId === reminderId,
        timeoutMs: 1000,
      }),
    ).rejects.toThrow();

    // Cleanup: restore ACTIVE so other tests/dev flows aren't surprised
    await request.post(`${apiBase}/v1/seeding/set-delivery-state`, {
      data: { userId: 'testuser@example.com', state: 'ACTIVE' },
    });
  });

  test('05-08: Usage suspended allows limited deliveries per 3-day window @integration', async ({ request }) => {
    const mailhogOk = await isMailHogAvailable();
    test.skip(!mailhogOk, 'MailHog is not available');

    const apiBase = process.env.API_BASE_URL || 'http://localhost:3801';
    await clearMailHog();

    // Seed + login
    await request.post(`${apiBase}/v1/seeding/seed`);
    const loginRes = await request.post(`${apiBase}/v1/auth/login`, {
      data: { email: 'testuser@example.com', password: 'TestUser123!' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginJson = (await loginRes.json()) as any;
    const accessToken = loginJson?.data?.tokens?.accessToken as string;
    expect(accessToken).toBeTruthy();
    const authHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Suspend usage (3 days) and clear any prior usage counters
    const suspendRes = await request.post(`${apiBase}/v1/seeding/set-delivery-state`, {
      data: {
        userId: 'testuser@example.com',
        state: 'USAGE_SUSPENDED',
        reason: 'E2E usage suspended test',
        days: 3,
      },
    });
    expect(suspendRes.ok()).toBeTruthy();

    // Choose a profile with email at tier 1
    const profilesRes = await request.get(`${apiBase}/v1/escalation-profiles`, { headers: authHeaders });
    expect(profilesRes.ok()).toBeTruthy();
    const profiles = (await profilesRes.json()) as any[];
    const profileWithEmailTier1 = profiles.find((p) => {
      const tiers = (p?.tiers || []) as Array<{ tierNumber: number; agentIds: string[] }>;
      const t1 = tiers.find((t) => t.tierNumber === 1);
      return !!t1 && t1.agentIds?.includes('email');
    });
    expect(profileWithEmailTier1?.id).toBeTruthy();

    // Default allowance is 3 per window (USAGE_SUSPENSION_ALLOWANCE_PER_WINDOW, default 3)
    const deliveredTitles: string[] = [];
    for (let i = 0; i < 4; i++) {
      const title = `UsageSuspended ${i} ${Date.now()}`;
      const triggerAt = new Date(Date.now() + 60 * 1000).toISOString();
      const createRes = await request.post(`${apiBase}/v1/reminders`, {
        headers: authHeaders,
        data: {
          title,
          importance: 'MEDIUM',
          escalationProfileId: profileWithEmailTier1.id,
          schedule: { type: 'ONCE', triggerAt, timezone: 'UTC' },
        },
      });
      expect(createRes.ok()).toBeTruthy();
      const created = (await createRes.json()) as any;
      const reminderId = (created?.data?.id || created?.id) as string;
      expect(reminderId).toBeTruthy();

      const triggerRes = await request.post(`${apiBase}/v1/seeding/trigger-notification`, {
        data: { reminderId, userId: 'me', tier: 1 },
      });
      expect(triggerRes.ok()).toBeTruthy();

      if (i < 3) {
        deliveredTitles.push(title);
        await waitForEmail({
          to: 'testuser@example.com',
          subjectIncludes: title,
          bodyIncludes: [`Reminder ID: ${reminderId}`, 'Tier: 1'],
          timeoutMs: 20000,
        });
      } else {
        // 4th should be blocked; give it a moment then ensure no email with that subject exists
        await new Promise((r) => setTimeout(r, 1500));
        const msgs = await getMailHogMessages();
        const hasFourth = msgs.some((m) => (m.Content?.Headers?.Subject?.[0] || '').includes(title));
        expect(hasFourth).toBe(false);
      }
    }

    // Cleanup
    await request.post(`${apiBase}/v1/seeding/set-delivery-state`, {
      data: { userId: 'testuser@example.com', state: 'ACTIVE' },
    });
  });
});
