import { createRequire } from 'node:module';

const nodeRequire = createRequire(__filename);
export const { createWebhookHandler, createStoreClient } = nodeRequire(
  '@noctusoft/store-client',
) as typeof import('@noctusoft/store-client');
