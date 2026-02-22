import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import { Task } from '../types';

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function SortableTaskCard({ task, onClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={isDragging ? 'rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 overflow-hidden ring-2 ring-primary/20 transition-all' : 'transition-all'}
    >
      <div className={isDragging ? 'invisible' : ''}>
        <TaskCard task={task} onClick={onClick} />
      </div>
    </div>
  );
}
