import React from 'react'
import type { TaskQueueState, AgentStatus, Task } from '../../shared/types.js'
import { TaskTable } from './TaskTable.js'

interface TaskQueueViewProps {
  state: TaskQueueState
  onTaskSelect: (task: Task) => void
  onAbortTask: (taskId: string) => void
  onRerunTask: (task: Task) => void
}

export const TaskQueueView: React.FC<TaskQueueViewProps> = ({
  state,
  onTaskSelect,
  onAbortTask,
  onRerunTask,
}) => {
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'running' | 'completed' | 'failed'>('all')
  const [priorityFilter, setPriorityFilter] = React.useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [agentFilter, setAgentFilter] = React.useState<string>('all')

  const handleSetFilters = (filters: {
    status?: typeof statusFilter
    priority?: typeof priorityFilter
    agent?: string
  }) => {
    if (filters.status) setStatusFilter(filters.status)
    if (filters.priority) setPriorityFilter(filters.priority)
    if (filters.agent) setAgentFilter(filters.agent)
  }

  return (
    <div>
      <TaskTable
        tasks={state.tasks}
        activeTaskId={state.activeTaskId || ''}
        onTaskSelect={onTaskSelect}
        onAbortTask={onAbortTask}
        onRerunTask={onRerunTask}
        onSetFilters={handleSetFilters}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        agentFilter={agentFilter}
      />
    </div>
  )
} 