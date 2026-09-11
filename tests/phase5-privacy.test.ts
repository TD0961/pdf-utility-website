import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAnalyticsPayload, trackEvent } from '../src/lib/analytics/events';

describe('Phase 5: Privacy Decoupling & Analytics Payload Sanitization', () => {
  it('strips all sensitive document keys from payload', () => {
    const rawPayload = {
      toolId: 'merge-pdf',
      file: 'sensitive_financials.pdf',
      filename: 'tax_return_2025.pdf',
      name: 'invoice.pdf',
      pdf: 'data',
      doc: 'data',
      document: 'data',
      bytes: 524288,
      buffer: [1, 2, 3],
      arrayBuffer: new ArrayBuffer(8),
      blob: new Blob(['test']),
      url: 'blob:http://localhost/12345',
      dataUrl: 'data:application/pdf;base64,...',
      password: 'SuperSecretPassword123!',
      text: 'Confidential client contract terms...',
      content: 'Contract content',
      extractedText: 'Extracted confidential text',
      coordinates: { x: 100, y: 200 },
      pageCount: 12,
      durationMs: 450,
    };

    const sanitized = sanitizeAnalyticsPayload(rawPayload);

    // Document payload terms MUST NOT exist
    assert.equal('file' in sanitized, false);
    assert.equal('filename' in sanitized, false);
    assert.equal('name' in sanitized, false);
    assert.equal('pdf' in sanitized, false);
    assert.equal('doc' in sanitized, false);
    assert.equal('document' in sanitized, false);
    assert.equal('bytes' in sanitized, false);
    assert.equal('buffer' in sanitized, false);
    assert.equal('arrayBuffer' in sanitized, false);
    assert.equal('blob' in sanitized, false);
    assert.equal('url' in sanitized, false);
    assert.equal('dataUrl' in sanitized, false);
    assert.equal('password' in sanitized, false);
    assert.equal('text' in sanitized, false);
    assert.equal('content' in sanitized, false);
    assert.equal('extractedText' in sanitized, false);
    assert.equal('coordinates' in sanitized, false);

    // Safe operational metadata is preserved
    assert.equal(sanitized.toolId, 'merge-pdf');
    assert.equal(sanitized.pageCount, 12);
    assert.equal(sanitized.durationMs, 450);
  });

  it('rejects binary objects and large text payloads', () => {
    const rawPayload = {
      toolId: 'split-pdf',
      binaryData: new Uint8Array([1, 2, 3, 4]),
      largeText: 'a'.repeat(300),
      smallText: 'valid-action',
    };

    const sanitized = sanitizeAnalyticsPayload(rawPayload);

    assert.equal('binaryData' in sanitized, false);
    assert.equal('largeText' in sanitized, false);
    assert.equal(sanitized.smallText, 'valid-action');
    assert.equal(sanitized.toolId, 'split-pdf');
  });

  it('dispatches event cleanly when window is defined', () => {
    interface CallInfo {
      cmd: string;
      eventName: string;
      params: Record<string, unknown>;
    }
    const calls: CallInfo[] = [];
    (global as unknown as { window: unknown }).window = {
      gtag: (cmd: string, eventName: string, params?: Record<string, unknown>) => {
        calls.push({ cmd, eventName, params: params ?? {} });
      },
    };

    const success = trackEvent({
      event: 'tool_complete',
      toolId: 'merge-pdf',
      pageCount: 5,
      durationMs: 120,
    });

    assert.equal(success, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].cmd, 'event');
    assert.equal(calls[0].eventName, 'tool_complete');
    assert.equal(calls[0].params.toolId, 'merge-pdf');
    assert.equal(calls[0].params.pageCount, 5);
    assert.equal(calls[0].params.durationMs, 120);
  });
});
