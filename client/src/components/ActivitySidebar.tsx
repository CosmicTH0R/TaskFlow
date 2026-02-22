import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { ArrowRight, Plus, Trash2, UserPlus, Edit3, MoveRight, UserMinus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

const ACTION_ICONS: Record<string, any> = {
  BOARD_CREATED: Plus,
  LIST_CREATED: Plus,
  LIST_DELETED: Trash2,
  TASK_CREATED: Plus,
  TASK_UPDATED: Edit3,
  TASK_DELETED: Trash2,
  TASK_MOVED: MoveRight,
  TASK_ASSIGNED: UserPlus,
  TASK_UNASSIGNED: UserMinus,
  MEMBER_ADDED: UserPlus,
};

const ACTION_LABELS: Record<string, string> = {
  BOARD_CREATED: 'created this board',
  LIST_CREATED: 'created list',
  LIST_DELETED: 'deleted list',
  TASK_CREATED: 'created task',
  TASK_UPDATED: 'updated task',
  TASK_DELETED: 'deleted task',
  TASK_MOVED: 'moved task',
  TASK_ASSIGNED: 'assigned',
  TASK_UNASSIGNED: 'unassigned',
  MEMBER_ADDED: 'added member',
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

interface ActivitySidebarProps {
  boardId: string;
  onClose: () => void;
}

export default function ActivitySidebar({ boardId, onClose }: ActivitySidebarProps) {
  const { activities, activityPagination, fetchActivity } = useBoardStore();

  useEffect(() => {
    fetchActivity(boardId, 1);
  }, [boardId]);

  const getDetails = (details?: string) => {
    if (!details) return {};
    try { return JSON.parse(details); } catch { return {}; }
  };

  return (
    <Sheet open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-border/50 bg-card p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border/50 flex-none">
          <SheetTitle className="text-xl">Activity</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative timeline-line">
          {activities.map((activity, index) => {
            const Icon = ACTION_ICONS[activity.action] || Edit3;
            const details = getDetails(activity.details);
            return (
              <motion.div
                key={activity.id}
                className="flex gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 relative z-10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.05 + 0.1 }}
                >
                  <Icon size={14} />
                </motion.div>
                <div className="flex-1 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    <strong className="text-foreground">{activity.user.name}</strong>{' '}
                    <span className="text-muted-foreground">{ACTION_LABELS[activity.action] || activity.action}</span>
                    {details.title && <span className="text-foreground"> "<em>{details.title}</em>"</span>}
                    {details.fromList && details.toList && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground ml-1">
                        from <span className="text-foreground font-medium">{details.fromList}</span>
                        <ArrowRight size={12} />
                        <span className="text-foreground font-medium">{details.toList}</span>
                      </span>
                    )}
                    {details.memberName && <strong className="text-foreground ml-1">{details.memberName}</strong>}
                    {details.assigneeName && <strong className="text-foreground ml-1">{details.assigneeName}</strong>}
                  </p>
                  <span className="text-xs text-muted-foreground mt-1 block">{formatTime(activity.createdAt)}</span>
                </div>
              </motion.div>
            );
          })}

          {activities.length === 0 && (
            <motion.div
              className="text-center text-muted-foreground py-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No activity yet
            </motion.div>
          )}

          {activityPagination && activityPagination.page < activityPagination.totalPages && (
            <div className="pt-4 pb-8 flex justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchActivity(boardId, activityPagination.page + 1)}
                  className="btn-press"
                >
                  Load more
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
