import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { createElement } from 'react';

import { FEEDBACK_PRODUCT_KEY, FEEDBACK_WIDGET_SRC, FeedbackWidget } from './feedback-widget';

// next/script defers injection to an effect; render it as a plain tag so the
// attributes handed to it can be asserted.
jest.mock('next/script', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { strategy, ...rest } = props;
    return createElement('script', { ...rest, 'data-strategy': strategy });
  },
}));

describe('FeedbackWidget', () => {
  it('loads the Noctusoft widget for this product after hydration', () => {
    const { container } = render(createElement(FeedbackWidget));

    const script = container.querySelector('script');
    expect(script).not.toBeNull();
    expect(script).toHaveAttribute('src', 'https://store.noctusoft.com/feedback/widget.js');
    expect(script).toHaveAttribute('data-product', 'escalating-reminders');
    expect(script).toHaveAttribute('data-strategy', 'afterInteractive');
    expect(FEEDBACK_WIDGET_SRC).toBe('https://store.noctusoft.com/feedback/widget.js');
    expect(FEEDBACK_PRODUCT_KEY).toBe('escalating-reminders');
  });

  it('is mounted once, in the root layout body, so every page gets it', () => {
    const layout = readFileSync(join(__dirname, '../app/layout.tsx'), 'utf8');

    expect(layout).toContain("import { FeedbackWidget } from '@/components/feedback-widget';");
    expect(layout.match(/<FeedbackWidget \/>/g)).toHaveLength(1);
    expect(layout.indexOf('<body')).toBeLessThan(layout.indexOf('<FeedbackWidget />'));
    expect(layout.indexOf('<FeedbackWidget />')).toBeLessThan(layout.indexOf('</body>'));
  });
});
