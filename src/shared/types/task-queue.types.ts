export interface Task {
  id: string;
  status: TaskStatus;
  error?: string;
  timestamp: number;
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABORTED = 'aborted',
}

export interface TaskQueueState {
  tasks: Task[];
  running: boolean;
  aborted: boolean;
  lastUpdated: number;
}
