import Script from 'next/script';

/** Noctusoft cross-product feedback service, served from the relay. */
export const FEEDBACK_WIDGET_SRC = 'https://store.noctusoft.com/feedback/widget.js';
/** This product's key on the feedback service. */
export const FEEDBACK_PRODUCT_KEY = 'escalating-reminders';

/**
 * Loads the Noctusoft feedback widget: a floating "Feedback" button that posts
 * to the relay's public route. The relay accepts only escalatingreminders.com
 * origins (plus localhost), so no key, env var, or server route is needed.
 */
export function FeedbackWidget(): JSX.Element {
  return (
    <Script
      src={FEEDBACK_WIDGET_SRC}
      data-product={FEEDBACK_PRODUCT_KEY}
      strategy="afterInteractive"
    />
  );
}
