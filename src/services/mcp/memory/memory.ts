import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const MEMORY_DIR = join(__dirname, '..', '..', '..', 'data', 'memory');
const MEMORY_FILE = join(MEMORY_DIR, 'memory.json');

export interface MemoryItem {
  id: string;
  content: string;
  timestamp: number;
  tags?: string[];
}

export interface Memory {
  items: MemoryItem[];
  lastUpdate: number;
}

export function loadMemoryFromDisk(): Memory {
  try {
    if (!existsSync(MEMORY_DIR)) {
      mkdirSync(MEMORY_DIR, { recursive: true });
    }

    if (!existsSync(MEMORY_FILE)) {
      const initialMemory: Memory = {
        items: [],
        lastUpdate: Date.now(),
      };
      writeFileSync(MEMORY_FILE, JSON.stringify(initialMemory, null, 2));
      return initialMemory;
    }

    const memoryData = readFileSync(MEMORY_FILE, 'utf-8');
    return JSON.parse(memoryData) as Memory;
  } catch (error) {
    console.error('Error loading memory from disk:', error);
    return {
      items: [],
      lastUpdate: Date.now(),
    };
  }
}

export function saveMemoryToDisk(memory: Memory): void {
  try {
    if (!existsSync(MEMORY_DIR)) {
      mkdirSync(MEMORY_DIR, { recursive: true });
    }

    writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (error) {
    console.error('Error saving memory to disk:', error);
  }
}
