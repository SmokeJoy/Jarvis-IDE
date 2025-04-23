/**
 * @file types.ts
 * @description Type definitions for the board module
 */

import type { WebSocketMessageUnion } from '@shared/types/websocket.types';

/**
 * Represents a block of content in a board
 */
export interface BoardBlock {
  id: string;
  type: 'text' | 'image' | 'code';
  content: string;
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Represents a board with its blocks and metadata
 */
export interface Board {
  id: string;
  title: string;
  description?: string;
  blocks: BoardBlock[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * State of the board manager
 */
export interface BoardState {
  activeBoard: Board | null;
  boards: Board[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Events that can be emitted by the board manager
 */
export type BoardEvent = 
  | { type: 'BOARD_LOADED'; payload: Board }
  | { type: 'BOARD_CREATED'; payload: Board }
  | { type: 'BOARD_UPDATED'; payload: Board }
  | { type: 'BOARD_DELETED'; payload: string }
  | { type: 'BLOCK_ADDED'; payload: { boardId: string; block: BoardBlock } }
  | { type: 'BLOCK_UPDATED'; payload: { boardId: string; block: BoardBlock } }
  | { type: 'BLOCK_DELETED'; payload: { boardId: string; blockId: string } }
  | { type: 'ERROR'; payload: string };

/**
 * Handler for board events
 */
export type BoardEventHandler = (event: BoardEvent) => void;

/**
 * Messages that can be sent to/from the extension
 */
export type BoardMessage = WebSocketMessageUnion & {
  type: 'board.load' | 'board.create' | 'board.update' | 'board.delete' | 'board.error';
  payload: {
    board?: Board;
    boardId?: string;
    error?: string;
  };
}; 