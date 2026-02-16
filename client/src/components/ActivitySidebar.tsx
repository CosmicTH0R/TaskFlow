import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { X, ArrowRight, Plus, Trash2, UserPlus, Edit3, MoveRight, UserMinus } from 'lucide-react';

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
    <div className="activity-sidebar">
      <div className="panel-header">
        <h3>Activity</h3>
        <button className="icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="activity-list">
        {activities.map((activity) => {
          const Icon = ACTION_ICONS[activity.action] || Edit3;
          const details = getDetails(activity.details);
          return (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                <Icon size={14} />
              </div>
              <div className="activity-content">
                <p>
                  <strong>{activity.user.name}</strong>{' '}
                  {ACTION_LABELS[activity.action] || activity.action}
                  {details.title && <> "<em>{details.title}</em>"</>}
                  {details.fromList && details.toList && (
                    <> from {details.fromList} <ArrowRight size={12} className="inline-icon" /> {details.toList}</>
                  )}
                  {details.memberName && <> <strong>{details.memberName}</strong></>}
                  {details.assigneeName && <> <strong>{details.assigneeName}</strong></>}
                </p>
                <span className="activity-time">{formatTime(activity.createdAt)}</span>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p className="empty-text">No activity yet</p>
        )}
        {activityPagination && activityPagination.page < activityPagination.totalPages && (
          <button
            className="btn btn-ghost btn-sm load-more-btn"
            onClick={() => fetchActivity(boardId, activityPagination.page + 1)}
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
