import { useState } from 'react';
import { SubTask } from '../types';
import { subtasksAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubTaskListProps {
  taskId: string;
  subTasks: SubTask[];
  onChange: (subTasks: SubTask[]) => void;
  canEdit: boolean;
}

export default function SubTaskList({ taskId, subTasks, onChange, canEdit }: SubTaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const completed = subTasks.filter((s) => s.completed).length;
  const total = subTasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const { data } = await subtasksAPI.create(taskId, newTitle.trim());
      onChange([...subTasks, data.subTask]);
      setNewTitle('');
      setAdding(false);
    } catch {
      toast.error('Failed to add subtask');
    }
  };

  const handleToggle = async (sub: SubTask) => {
    try {
      const { data } = await subtasksAPI.update(taskId, sub.id, { completed: !sub.completed });
      onChange(subTasks.map((s) => (s.id === sub.id ? data.subTask : s)));
    } catch {
      toast.error('Failed to update subtask');
    }
  };

  const handleDelete = async (subId: string) => {
    try {
      await subtasksAPI.delete(taskId, subId);
      onChange(subTasks.filter((s) => s.id !== subId));
    } catch {
      toast.error('Failed to delete subtask');
    }
  };

  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{completed}/{total}</span>
        </div>
      )}

      <div className="space-y-1">
        <AnimatePresence>
          {subTasks.map((sub) => (
            <motion.div
              key={sub.id}
              className="flex items-center gap-2 group py-1 px-1 rounded-md hover:bg-muted/50 transition-colors"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              layout
            >
              <input
                type="checkbox"
                checked={sub.completed}
                onChange={() => { if (canEdit) handleToggle(sub); }}
                disabled={!canEdit}
                className="w-4 h-4 rounded border-border accent-primary cursor-pointer disabled:cursor-default"
              />
              <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {sub.title}
              </span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(sub.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {canEdit && (
        adding ? (
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Subtask title..."
              autoFocus
              className="h-8 text-sm flex-1"
              onBlur={() => { if (!newTitle.trim()) setAdding(false); }}
            />
            <Button type="submit" size="sm" className="h-8 btn-press" disabled={!newTitle.trim()}>Add</Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground w-full justify-start px-1 btn-press"
            onClick={() => setAdding(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add subtask
          </Button>
        )
      )}
    </div>
  );
}
