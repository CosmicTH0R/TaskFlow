import { Task } from '../types';
import { Calendar, Flag } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

function getDueStatus(dueDate?: string): 'overdue' | 'today' | 'normal' | null {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  if (due < now) return 'overdue';
  if (due.getTime() === now.getTime()) return 'today';
  return 'normal';
}

export default function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const dueStatus = getDueStatus(task.dueDate);

  return (
    <div
      className={`task-card ${isDragging ? 'task-card-dragging' : ''}`}
      onClick={onClick}
    >
      {/* Label chips */}
      {task.labels && task.labels.length > 0 && (
        <div className="task-label-chips">
          {task.labels.slice(0, 4).map((tl) => (
            <span
              key={tl.id}
              className="task-label-chip"
              style={{ backgroundColor: tl.label.color }}
              title={tl.label.name}
            />
          ))}
        </div>
      )}

      <div className="task-card-top">
        <span
          className="priority-badge"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '20', color: PRIORITY_COLORS[task.priority] }}
        >
          <Flag size={10} />
          {task.priority}
        </span>
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="task-desc">{task.description.substring(0, 80)}{task.description.length > 80 ? '...' : ''}</p>
      )}
      <div className="task-card-footer">
        {task.dueDate && (
          <span className={`task-due ${dueStatus === 'overdue' ? 'task-due-overdue' : dueStatus === 'today' ? 'task-due-today' : ''}`}>
            <Calendar size={12} />
            {dueStatus === 'overdue' ? 'Overdue' : dueStatus === 'today' ? 'Due today' : new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.assignees && task.assignees.length > 0 && (
          <div className="task-assignees">
            {task.assignees.slice(0, 3).map((a) => (
              <div key={a.id} className="avatar avatar-xs" title={a.user.name}>
                {a.user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
