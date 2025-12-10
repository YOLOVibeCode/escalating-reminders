import type { Subscription, PaymentHistory } from '@er/types';

/**
 * Service interface for subscription operations.
 * Follows ISP - only subscription management methods.
 */
export interface ISubscriptionService {
  /**
   * Get user's current subscription.
   * @throws {NotFoundError} If subscription doesn't exist
   */
  getByUser(userId: string): Promise<Subscription>;

  /**
   * Create a checkout session for subscription upgrade.
   */
  createCheckout(userId: string, tier: string): Promise<CheckoutSession>;

  /**
   * Cancel subscription (at period end).
   */
  cancel(userId: string): Promise<Subscription>;

  /**
   * Reactivate a canceled subscription.
   */
  reactivate(userId: string): Promise<Subscription>;
}

/**
 * Service interface for payment operations.
 * Separated per ISP - payments are distinct from subscriptions.
 */
export interface IPaymentService {
  /**
   * Get payment history for a subscription.
   */
  getHistory(subscriptionId: string): Promise<PaymentHistory[]>;

  /**
   * Process a payment webhook from Square.
   */
  processWebhook(event: SquareWebhookEvent): Promise<void>;
}

export interface CheckoutSession {
  checkoutUrl: string;
  checkoutId: string;
}

export interface SquareWebhookEvent {
  type: string;
  data: {
    object: {
      subscription?: unknown;
      invoice?: unknown;
      payment?: unknown;
    };
  };
}

