import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { toast, ToastMessage } from '../src/lib/notifications/toast';

describe('Toast Notification System', () => {
  beforeEach(() => {
    toast.clear();
  });

  it('creates toasts with correct categories and attributes', () => {
    const received: ToastMessage[][] = [];
    const unsubscribe = toast.subscribe((list) => {
      received.push(list);
    });

    const successId = toast.success('File processed successfully', { title: 'Export Complete' });
    assert.ok(successId, 'Success toast returned an id');

    const warningId = toast.warning('Page count exceeds standard layout', { title: 'Layout Notice' });
    assert.ok(warningId, 'Warning toast returned an id');

    const errorId = toast.error('Decryption failed with invalid password', { title: 'Auth Error' });
    assert.ok(errorId, 'Error toast returned an id');

    const infoId = toast.info('Local WebAssembly engine ready');
    assert.ok(infoId, 'Info toast returned an id');

    const currentToasts = received[received.length - 1];
    assert.equal(currentToasts.length, 4, '4 toasts present in list');

    assert.equal(currentToasts[0].type, 'success');
    assert.equal(currentToasts[0].title, 'Export Complete');
    assert.equal(currentToasts[0].message, 'File processed successfully');

    assert.equal(currentToasts[1].type, 'warning');
    assert.equal(currentToasts[2].type, 'error');
    assert.equal(currentToasts[3].type, 'info');

    unsubscribe();
  });

  it('deduplicates identical messages within deduplication window', () => {
    const id1 = toast.success('Document downloaded');
    assert.ok(id1, 'First message accepted');

    const id2 = toast.success('Document downloaded');
    assert.equal(id2, null, 'Immediate duplicate should be suppressed');

    // Different type or message should be allowed
    const id3 = toast.info('Document downloaded');
    assert.ok(id3, 'Different type is not a duplicate');
  });

  it('ignores empty or whitespace-only messages', () => {
    assert.equal(toast.show('info', ''), null, 'Empty string ignored');
    assert.equal(toast.show('error', '   '), null, 'Whitespace ignored');
  });

  it('dismisses a single toast by ID', () => {
    const id1 = toast.info('Message one');
    const id2 = toast.info('Message two');

    let current: ToastMessage[] = [];
    const unsubscribe = toast.subscribe((list) => {
      current = list;
    });

    assert.equal(current.length, 2);
    if (id1) toast.dismiss(id1);

    assert.equal(current.length, 1);
    assert.equal(current[0].id, id2);

    unsubscribe();
  });

  it('caps max visible toasts at 4 to prevent viewport flooding', () => {
    toast.info('Message A');
    toast.info('Message B');
    toast.info('Message C');
    toast.info('Message D');
    toast.info('Message E'); // Should pop the oldest (Message A)

    let current: ToastMessage[] = [];
    const unsubscribe = toast.subscribe((list) => {
      current = list;
    });

    assert.equal(current.length, 4, 'Should cap at 4 toasts');
    assert.equal(current[0].message, 'Message B', 'Oldest toast Message A was popped');
    assert.equal(current[3].message, 'Message E', 'Newest toast is present');

    unsubscribe();
  });

  it('sets appropriate default durations based on category', () => {
    let current: ToastMessage[] = [];
    const unsubscribe = toast.subscribe((list) => {
      current = list;
    });

    toast.error('Critical failure');
    toast.warning('Attention required');
    toast.success('Done');

    assert.equal(current[0].duration, 8000, 'Errors should allow 8000ms reading time');
    assert.equal(current[1].duration, 6000, 'Warnings should allow 6000ms reading time');
    assert.equal(current[2].duration, 4000, 'Success should allow 4000ms reading time');

    unsubscribe();
  });

  it('clears all active toasts with toast.clear()', () => {
    toast.info('Test 1');
    toast.info('Test 2');

    let current: ToastMessage[] = [];
    const unsubscribe = toast.subscribe((list) => {
      current = list;
    });

    assert.equal(current.length, 2);
    toast.clear();
    assert.equal(current.length, 0);

    unsubscribe();
  });
});
