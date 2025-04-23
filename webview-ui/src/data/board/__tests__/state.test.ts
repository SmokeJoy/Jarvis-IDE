import { vi } from 'vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoardStateManager } from '../state';
import type { Board, BoardBlock, BoardEvent } from '../types';

// Mock logger
vi.mock('@shared/utils/outputLogger', () => ({
  default: {
    createComponentLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

describe('BoardStateManager', () => {
  let stateManager: BoardStateManager;

  beforeEach(() => {
    // Reset the singleton instance before each test
    BoardStateManager.resetInstance();
    stateManager = BoardStateManager.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = BoardStateManager.getInstance();
    const instance2 = BoardStateManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize with default state', () => {
    const state = stateManager.getState();
    expect(state).toEqual({
      activeBoard: null,
      boards: [],
      isLoading: false,
      error: null
    });
  });

  it('should set loading state', () => {
    const listener = vi.fn();
    stateManager.subscribe(listener);

    stateManager.setLoading(true);
    expect(stateManager.getState().isLoading).toBe(true);
    expect(listener).toHaveBeenCalledWith({
      type: 'BOARD_LOADED',
      payload: null
    });
  });

  it('should set error state', () => {
    const listener = vi.fn();
    stateManager.subscribe(listener);

    const error = 'Test error';
    stateManager.setError(error);
    expect(stateManager.getState().error).toBe(error);
    expect(listener).toHaveBeenCalledWith({
      type: 'ERROR',
      payload: error
    });
  });

  it('should manage boards', () => {
    const listener = vi.fn();
    stateManager.subscribe(listener);

    const board: Board = {
      id: '1',
      title: 'Test Board',
      blocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Add board
    stateManager.addBoard(board);
    expect(stateManager.getState().boards).toContain(board);
    expect(listener).toHaveBeenCalledWith({
      type: 'BOARD_CREATED',
      payload: board
    });

    // Update board
    const updatedBoard = { ...board, title: 'Updated Board' };
    stateManager.updateBoard(updatedBoard);
    expect(stateManager.getState().boards[0].title).toBe('Updated Board');
    expect(listener).toHaveBeenCalledWith({
      type: 'BOARD_UPDATED',
      payload: updatedBoard
    });

    // Delete board
    stateManager.deleteBoard(board.id);
    expect(stateManager.getState().boards).toHaveLength(0);
    expect(listener).toHaveBeenCalledWith({
      type: 'BOARD_DELETED',
      payload: board.id
    });
  });

  it('should manage blocks', () => {
    const board: Board = {
      id: '1',
      title: 'Test Board',
      blocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const block: BoardBlock = {
      id: '1',
      type: 'text',
      content: 'Test content',
      position: { x: 0, y: 0 }
    };

    stateManager.addBoard(board);
    const listener = vi.fn();
    stateManager.subscribe(listener);

    // Add block
    stateManager.addBlock(board.id, block);
    expect(stateManager.getState().boards[0].blocks).toContain(block);
    expect(listener).toHaveBeenCalledWith({
      type: 'BLOCK_ADDED',
      payload: { boardId: board.id, block }
    });

    // Update block
    const updatedBlock = { ...block, content: 'Updated content' };
    stateManager.updateBlock(board.id, updatedBlock);
    expect(stateManager.getState().boards[0].blocks[0].content).toBe('Updated content');
    expect(listener).toHaveBeenCalledWith({
      type: 'BLOCK_UPDATED',
      payload: { boardId: board.id, block: updatedBlock }
    });

    // Delete block
    stateManager.deleteBlock(board.id, block.id);
    expect(stateManager.getState().boards[0].blocks).toHaveLength(0);
    expect(listener).toHaveBeenCalledWith({
      type: 'BLOCK_DELETED',
      payload: { boardId: board.id, blockId: block.id }
    });
  });

  it('should handle subscription cleanup', () => {
    const listener = vi.fn();
    const unsubscribe = stateManager.subscribe(listener);

    stateManager.setError('Test error');
    expect(listener).toHaveBeenCalled();

    listener.mockClear();
    unsubscribe();

    stateManager.setError('Another error');
    expect(listener).not.toHaveBeenCalled();
  });

  it('should reset state', () => {
    const board: Board = {
      id: '1',
      title: 'Test Board',
      blocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    stateManager.addBoard(board);
    stateManager.setActiveBoard(board);
    stateManager.setError('Test error');
    stateManager.setLoading(true);

    stateManager.reset();

    expect(stateManager.getState()).toEqual({
      activeBoard: null,
      boards: [],
      isLoading: false,
      error: null
    });
  });

  it('should handle errors in listeners gracefully', () => {
    const errorListener = vi.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });
    stateManager.subscribe(errorListener);

    // This should not throw
    expect(() => stateManager.setError('Test error')).not.toThrow();
  });
}); 