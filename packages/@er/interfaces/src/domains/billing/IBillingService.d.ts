import type { Subscription, PaymentHistory } from '@er/types';
export interface ISubscriptionService {
    getByUser(userId: string): Promise<Subscription>;
    createCheckout(userId: string, tier: string): Promise<CheckoutSession>;
    cancel(userId: string): Promise<Subscription>;
    reactivate(userId: string): Promise<Subscription>;
}
export interface IPaymentService {
    getHistory(subscriptionId: string): Promise<PaymentHistory[]>;
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
//# sourceMappingURL=IBillingService.d.ts.map