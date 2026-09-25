import type { Subscription, PaymentHistory } from '@er/types';

/**
 * Service interface for subscription operations.
 * Follows ISP - only subscription management methods.
 */
export interface ISubscriptionService {
  getByUser(userId: string): Promise<Subscription>;
  createCheckout(userId: string, tier: string): Promise<CheckoutSession>;
  cancel(userId: string): Promise<Subscription>;
  reactivate(userId: string): Promise<Subscription>;
}

/**
 * Service interface for payment operations.
 * Separated per ISP - payments are distinct from subscriptions.
 */
export interface IPaymentService {
  getHistory(subscriptionId: string): Promise<PaymentHistory[]>;
  /** Event v1 from store.noctusoft.com. */
  processWebhook(event: StoreWebhookEvent): Promise<void>;
}

export interface CheckoutSession {
  checkoutUrl: string;
  checkoutId: string;
}

export interface StoreWebhookEvent {
  id: string;
  type: string;
  version: 1;
  store: string;
  [field: string]: unknown;
}
