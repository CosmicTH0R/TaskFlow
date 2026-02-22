import { useState } from 'react';
import { TaskDependency, Task } from '../types';
import { dependenciesAPI } from '../services/api';
import { useBoardStore } from '../store/boardStore';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X, Link2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DependencyPickerProps {
  taskId: string;
  dependencies: TaskDependency[];
  onChange: (deps: TaskDependency[]) => void;
  canEdit: boolean;
}

export default function DependencyPicker({ taskId, dependencies, onChange, canEdit }: DependencyPickerProps) {
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState('');
  const lists = useBoardStore((s) => s.lists);

  // Gather all tasks across all lists, excluding the current task and already-linked tasks
  const linkedIds = new Set([taskId, ...dependencies.map((d) => d.dependsOnTaskId)]);
  const allTasks = lists.flatMap((l) => l.tasks).filter((t) => !linkedIds.has(t.id));
  const filtered = search
    ? allTasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : allTasks;

  const handleAdd = async (depTaskId: string) => {
    try {
      const { data } = await dependenciesAPI.add(taskId, depTaskId);
      onChange([...dependencies, data.dependency]);
      setPicking(false);
      setSearch('');
      toast.success('Dependency added');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add dependency');
    }
  };

  const handleRemove = async (depId: string) => {
    try {
      await dependenciesAPI.remove(taskId, depId);
      onChange(dependencies.filter((d) => d.id !== depId));
      toast.success('Dependency removed');
    } catch {
      toast.error('Failed to remove dependency');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <AnimatePresence>
          {dependencies.map((dep) => (
            <motion.span
              key={dep.id}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
            >
              <AlertTriangle className="w-3 h-3" />
              {dep.dependsOn.title}
              {canEdit && (
                <button className="hover:text-foreground ml-0.5 transition-colors" onClick={() => handleRemove(dep.id)}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>

        {dependencies.length === 0 && (
          <span className="text-xs text-muted-foreground">No blockers</span>
        )}
      </div>

      {canEdit && (
        picking ? (
          <div className="space-y-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              autoFocus
              className="h-8 text-sm"
              onBlur={() => { setTimeout(() => { if (!search) setPicking(false); }, 200); }}
            />
            {filtered.length > 0 ? (
              <div className="max-h-40 overflow-y-auto border rounded-md bg-popover">
                {filtered.slice(0, 10).map((t) => (
                  <button
                    key={t.id}
                    className="flex items-center gap-2 w-full p-2 text-sm text-left hover:bg-muted transition-colors"
                    onClick={() => handleAdd(t.id)}
                  >
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground px-1">No matching tasks found.</p>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground w-full justify-start px-1 btn-press"
            onClick={() => setPicking(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add blocker
          </Button>
        )
      )}
    </div>
  );
}
