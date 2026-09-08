import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EditorHistoryManager } from '@/lib/pdf/editor/history';
import { createTextObject } from '@/lib/pdf/editor/objects';

describe('PDF Editor — History Manager & Undo/Redo Engine', () => {
  it('tracks sequential actions and manages undo/redo states', () => {
    const history = new EditorHistoryManager(10);
    assert.strictEqual(history.canUndo(), false);
    assert.strictEqual(history.canRedo(), false);

    const obj1 = createTextObject({ pageIndex: 0, x: 50, y: 50, text: 'Hello' });
    const obj2 = createTextObject({ pageIndex: 0, x: 100, y: 100, text: 'World' });

    history.push({ type: 'ADD_OBJECT', pageIndex: 0, object: obj1 });
    assert.strictEqual(history.canUndo(), true);
    assert.strictEqual(history.canRedo(), false);
    assert.strictEqual(history.undoCount, 1);

    history.push({ type: 'ADD_OBJECT', pageIndex: 0, object: obj2 });
    assert.strictEqual(history.undoCount, 2);

    // Undo action 2
    const undone2 = history.undo();
    assert.ok(undone2);
    assert.strictEqual(undone2.type, 'ADD_OBJECT');
    if (undone2.type === 'ADD_OBJECT') {
      assert.strictEqual(undone2.object.id, obj2.id);
    }
    assert.strictEqual(history.canUndo(), true);
    assert.strictEqual(history.canRedo(), true);
    assert.strictEqual(history.redoCount, 1);

    // Redo action 2
    const redone2 = history.redo();
    assert.ok(redone2);
    assert.strictEqual(redone2.type, 'ADD_OBJECT');
    assert.strictEqual(history.canRedo(), false);
    assert.strictEqual(history.undoCount, 2);
  });

  it('clears redo stack when a new action is recorded', () => {
    const history = new EditorHistoryManager(10);
    const obj1 = createTextObject({ pageIndex: 0, x: 10, y: 10, text: 'First' });
    const obj2 = createTextObject({ pageIndex: 0, x: 20, y: 20, text: 'Second' });
    const obj3 = createTextObject({ pageIndex: 0, x: 30, y: 30, text: 'Third' });

    history.push({ type: 'ADD_OBJECT', pageIndex: 0, object: obj1 });
    history.push({ type: 'ADD_OBJECT', pageIndex: 0, object: obj2 });

    history.undo();
    assert.strictEqual(history.canRedo(), true);

    // Push new action after undo -> redo stack must be purged
    history.push({ type: 'ADD_OBJECT', pageIndex: 0, object: obj3 });
    assert.strictEqual(history.canRedo(), false);
    assert.strictEqual(history.undoCount, 2);
  });

  it('enforces maximum history limit and evicts oldest entries gracefully', () => {
    const limit = 5;
    const history = new EditorHistoryManager(limit);

    for (let i = 1; i <= 10; i++) {
      const obj = createTextObject({ pageIndex: 0, x: i, y: i, text: `Step ${i}` });
      history.push({ type: 'ADD_OBJECT', pageIndex: 0, object: obj });
    }

    assert.strictEqual(history.undoCount, limit);

    // Can only undo up to the limit (5 times)
    for (let i = 0; i < limit; i++) {
      assert.strictEqual(history.canUndo(), true);
      history.undo();
    }
    assert.strictEqual(history.canUndo(), false);
    assert.strictEqual(history.undo(), null);
  });

  it('clear() resets both undo and redo stacks completely', () => {
    const history = new EditorHistoryManager(10);
    const obj = createTextObject({ pageIndex: 0, x: 10, y: 10, text: 'Reset test' });
    history.push({ type: 'ADD_OBJECT', pageIndex: 0, object: obj });
    history.undo();
    assert.strictEqual(history.canRedo(), true);

    history.clear();
    assert.strictEqual(history.canUndo(), false);
    assert.strictEqual(history.canRedo(), false);
    assert.strictEqual(history.undoCount, 0);
    assert.strictEqual(history.redoCount, 0);
  });
});
