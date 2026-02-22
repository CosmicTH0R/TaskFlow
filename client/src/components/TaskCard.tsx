import { Task } from '../types';
import { Calendar, Flag, ListChecks } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

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
  const priorityColor = PRIORITY_COLORS[task.priority] || '#6366f1';

  return (
    <Card
      className={`relative cursor-pointer border-white/5 transition-all duration-250 mb-2 task-card-hover ${
        isDragging ? 'opacity-50 border-primary shadow-xl scale-105 z-50' : 'bg-card/60 backdrop-blur-sm hover:border-primary/30'
      }`}
      style={{ '--priority-color': priorityColor } as React.CSSProperties}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Label chips */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 4).map((tl) => (
              <span
                key={tl.id}
                className="w-8 h-1.5 pt-0 pb-0 rounded-full transition-all duration-300 hover:w-12 hover:h-2"
                style={{ backgroundColor: tl.label.color }}
                title={tl.label.name}
              />
            ))}
          </div>
        )}

        <div className="flex items-center mb-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] h-4 px-1.5 py-0 border-transparent transition-all duration-300 ${
              task.priority === 'URGENT' ? 'animate-urgent-pulse' : ''
            }`}
            style={{
              backgroundColor: priorityColor + '20',
              color: priorityColor
            }}
          >
            <Flag className="w-2.5 h-2.5 mr-1" />
            {task.priority}
          </Badge>
        </div>
        <h4 className="text-sm font-semibold leading-tight text-foreground mb-1" style={{ wordBreak: 'break-word' }}>{task.title}</h4>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {task.description.replace(/<[^>]*>?/gm, '')}
          </p>
        )}

        {/* Subtask progress */}
        {task.subTasks && task.subTasks.length > 0 && (() => {
          const total = task.subTasks!.length;
          const done = task.subTasks!.filter((s: any) => s.completed).length;
          const pct = Math.round((done / total) * 100);
          return (
            <div className="flex items-center gap-2 mb-2 mt-1">
              <ListChecks className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{done}/{total}</span>
            </div>
          );
        })()}

        <div className="flex items-center justify-between mt-3">
          {task.dueDate ? (
            <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm transition-all duration-300 ${
              dueStatus === 'overdue'
                ? 'bg-destructive/15 text-destructive animate-pulse-overdue border border-destructive/30'
                : dueStatus === 'today'
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  : 'text-muted-foreground'
            }`}>
              <Calendar className="w-3 h-3" />
              {dueStatus === 'overdue' ? 'Overdue' : dueStatus === 'today' ? 'Due today' : new Date(task.dueDate).toLocaleDateString()}
            </span>
          ) : (
            <span /> // empty spacer so flex-between works
          )}

          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center -space-x-1.5">
              {task.assignees.slice(0, 3).map((a, i) => (
                <Avatar
                  key={a.id}
                  className="w-5 h-5 border border-card transition-transform duration-200 hover:scale-110 hover:z-10"
                  title={a.user.name}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                    {a.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
