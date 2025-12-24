"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWebhookSignature = generateWebhookSignature;
exports.verifyWebhookSignature = verifyWebhookSignature;
const crypto_1 = require("crypto");
function generateWebhookSignature(payload, secret) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = (0, crypto_1.createHmac)('sha256', secret);
    hmac.update(payloadString);
    return hmac.digest('hex');
}
function verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = generateWebhookSignature(payload, secret);
    return signature === expectedSignature;
}
//# sourceMappingURL=hmac.js.map