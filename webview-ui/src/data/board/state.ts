/**
 * @file state.ts
 * @description State management for the board module
 */

import type { Board, BoardBlock, BoardState, BoardEvent, BoardEventHandler } from './types';
import logger from '@shared/utils/outputLogger';

const componentLogger = logger.createComponentLogger('BoardState');

const INITIAL_STATE: BoardState = {
  activeBoard: null,
  boards: [],
  isLoading: false,
  error: null
};

/**
 * Manages the state of boards and blocks
 */
export class BoardStateManager {
  private static instance: BoardStateManager | null = null;
  private state: BoardState;
  private listeners: Set<BoardEventHandler>;

  private constructor() {
    this.state = { ...INITIAL_STATE };
    this.listeners = new Set();
  }

  /**
   * Gets the singleton instance of BoardStateManager
   */
  public static getInstance(): BoardStateManager {
    if (!BoardStateManager.instance) {
      BoardStateManager.instance = new BoardStateManager();
    }
    return BoardStateManager.instance;
  }

  /**
   * Resets the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    BoardStateManager.instance = null;
  }

  /**
   * Gets a readonly copy of the current state
   */
  public getState(): Readonly<BoardState> {
    return { ...this.state };
  }

  /**
   * Sets the loading state
   */
  public setLoading(isLoading: boolean): void {
    this.state.isLoading = isLoading;
    this.notifyListeners({
      type: isLoading ? 'BOARD_LOADED' : 'ERROR',
      payload: isLoading ? this.state.activeBoard! : 'Loading state changed'
    });
  }

  /**
   * Sets an error message
   */
  public setError(error: string | null): void {
    this.state.error = error;
    if (error) {
      this.notifyListeners({
        type: 'ERROR',
        payload: error
      });
    }
  }

  /**
   * Sets the active board
   */
  public setActiveBoard(board: Board | null): void {
    this.state.activeBoard = board;
    if (board) {
      this.notifyListeners({
        type: 'BOARD_LOADED',
        payload: board
      });
    }
  }

  /**
   * Updates the list of boards
   */
  public setBoards(boards: Board[]): void {
    this.state.boards = [...boards];
  }

  /**
   * Adds a new board
   */
  public addBoard(board: Board): void {
    this.state.boards = [...this.state.boards, board];
    this.notifyListeners({
      type: 'BOARD_CREATED',
      payload: board
    });
  }

  /**
   * Updates an existing board
   */
  public updateBoard(board: Board): void {
    const index = this.state.boards.findIndex(b => b.id === board.id);
    if (index >= 0) {
      this.state.boards = [
        ...this.state.boards.slice(0, index),
        board,
        ...this.state.boards.slice(index + 1)
      ];
      if (this.state.activeBoard?.id === board.id) {
        this.state.activeBoard = board;
      }
      this.notifyListeners({
        type: 'BOARD_UPDATED',
        payload: board
      });
    }
  }

  /**
   * Deletes a board
   */
  public deleteBoard(boardId: string): void {
    const index = this.state.boards.findIndex(b => b.id === boardId);
    if (index >= 0) {
      this.state.boards = [
        ...this.state.boards.slice(0, index),
        ...this.state.boards.slice(index + 1)
      ];
      if (this.state.activeBoard?.id === boardId) {
        this.state.activeBoard = null;
      }
      this.notifyListeners({
        type: 'BOARD_DELETED',
        payload: boardId
      });
    }
  }

  /**
   * Adds a block to a board
   */
  public addBlock(boardId: string, block: BoardBlock): void {
    const board = this.state.boards.find(b => b.id === boardId);
    if (board) {
      const updatedBoard = {
        ...board,
        blocks: [...board.blocks, block]
      };
      this.updateBoard(updatedBoard);
      this.notifyListeners({
        type: 'BLOCK_ADDED',
        payload: { boardId, block }
      });
    }
  }

  /**
   * Updates a block in a board
   */
  public updateBlock(boardId: string, block: BoardBlock): void {
    const board = this.state.boards.find(b => b.id === boardId);
    if (board) {
      const index = board.blocks.findIndex(b => b.id === block.id);
      if (index >= 0) {
        const updatedBoard = {
          ...board,
          blocks: [
            ...board.blocks.slice(0, index),
            block,
            ...board.blocks.slice(index + 1)
          ]
        };
        this.updateBoard(updatedBoard);
        this.notifyListeners({
          type: 'BLOCK_UPDATED',
          payload: { boardId, block }
        });
      }
    }
  }

  /**
   * Deletes a block from a board
   */
  public deleteBlock(boardId: string, blockId: string): void {
    const board = this.state.boards.find(b => b.id === boardId);
    if (board) {
      const index = board.blocks.findIndex(b => b.id === blockId);
      if (index >= 0) {
        const updatedBoard = {
          ...board,
          blocks: [
            ...board.blocks.slice(0, index),
            ...board.blocks.slice(index + 1)
          ]
        };
        this.updateBoard(updatedBoard);
        this.notifyListeners({
          type: 'BLOCK_DELETED',
          payload: { boardId, blockId }
        });
      }
    }
  }

  /**
   * Subscribes to state changes
   */
  public subscribe(handler: BoardEventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  /**
   * Resets the state to initial values
   */
  public reset(): void {
    this.state = { ...INITIAL_STATE };
  }

  /**
   * Notifies all listeners of a state change
   */
  private notifyListeners(event: BoardEvent): void {
    try {
      this.listeners.forEach(listener => listener(event));
    } catch (error) {
      componentLogger.error('Error notifying listeners:', { error });
    }
  }
} 