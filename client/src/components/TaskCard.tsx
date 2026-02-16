import { Task } from '../types';
import { Calendar, AlertTriangle, Flag, User } from 'lucide-react';

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

export default function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  return (
    <div
      className={`task-card ${isDragging ? 'task-card-dragging' : ''}`}
      onClick={onClick}
    >
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
          <span className="task-due">
            <Calendar size={12} />
            {new Date(task.dueDate).toLocaleDateString()}
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
