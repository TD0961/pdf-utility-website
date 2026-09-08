/**
 * Phase 3C.1: PDF Editor Engine — History Manager
 * Manages lightweight, operation-based undo/redo stacks with bounded memory limits.
 * Avoids duplicating complete PDF byte streams for each user interaction.
 */

import { EditorAction } from './types';

export const DEFAULT_MAX_HISTORY = 50;

export class EditorHistoryManager {
  private undoStack: EditorAction[] = [];
  private redoStack: EditorAction[] = [];
  private maxHistory: number;

  constructor(maxHistory = DEFAULT_MAX_HISTORY) {
    this.maxHistory = Math.max(1, maxHistory);
  }

  /**
   * Pushes a new action onto the undo stack and clears the redo stack.
   */
  public push(action: EditorAction): void {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift(); // Evict oldest action to bound memory
    }
    this.redoStack = [];
  }

  /**
   * Pops an action from the undo stack and registers it on the redo stack.
   * Returns the action to be reversed, or null if undo is not available.
   */
  public undo(): EditorAction | null {
    if (this.undoStack.length === 0) {
      return null;
    }
    const action = this.undoStack.pop()!;
    this.redoStack.push(action);
    return action;
  }

  /**
   * Pops an action from the redo stack and registers it on the undo stack.
   * Returns the action to be re-applied, or null if redo is not available.
   */
  public redo(): EditorAction | null {
    if (this.redoStack.length === 0) {
      return null;
    }
    const action = this.redoStack.pop()!;
    this.undoStack.push(action);
    return action;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public get undoCount(): number {
    return this.undoStack.length;
  }

  public get redoCount(): number {
    return this.redoStack.length;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
