import { useState, useEffect, useRef } from 'react';
import { Task, BoardMember, Comment, Label, TaskLabel } from '../types';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import { tasksAPI, commentsAPI, labelsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import ConfirmModal from './ConfirmModal';
import {
  X, Flag, Calendar, AlignLeft, Users, Trash2, UserPlus,
  Save, Clock, MessageSquare, Send, Tag, Plus
} from 'lucide-react';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

const LABEL_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface TaskModalProps {
  task: Task;
  boardMembers: BoardMember[];
  onClose: () => void;
}

export default function TaskModal({ task, boardMembers, onClose }: TaskModalProps) {
  const { updateTask, deleteTask } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [assignees, setAssignees] = useState(task.assignees);
  const [saving, setSaving] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Labels
  const [taskLabels, setTaskLabels] = useState<TaskLabel[]>(task.labels || []);
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  // Load comments and board labels
  useEffect(() => {
    loadComments();
    loadBoardLabels();

    // Real-time comment events
    const socket = getSocket();
    if (socket) {
      socket.on('comment:created', (comment: Comment) => {
        if (comment.taskId === task.id) {
          setComments((prev) => [comment, ...prev]);
        }
      });
      socket.on('comment:deleted', (data: { commentId: string; taskId: string }) => {
        if (data.taskId === task.id) {
          setComments((prev) => prev.filter((c) => c.id !== data.commentId));
        }
      });
      return () => {
        socket.off('comment:created');
        socket.off('comment:deleted');
      };
    }
  }, [task.id]);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const { data } = await commentsAPI.list(task.id);
      setComments(data.comments);
    } catch {
      /* silent */
    }
    setCommentsLoading(false);
  };

  const loadBoardLabels = async () => {
    try {
      const { data } = await labelsAPI.list(task.boardId);
      setBoardLabels(data.labels);
    } catch {
      /* silent */
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await updateTask(task.id, {
      title,
      description,
      priority,
      dueDate: dueDate || null,
    });
    setSaving(false);
    addToast('Task updated successfully!');
    onClose();
  };

  const handleDelete = async () => {
    await deleteTask(task.id, task.listId);
    addToast('Task deleted successfully!');
    onClose();
  };

  const handleAssign = async (userId: string) => {
    try {
      const { data } = await tasksAPI.assign(task.id, userId);
      setAssignees([...assignees, data.assignee]);
      addToast('Member assigned to task!');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to assign', 'error');
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      await tasksAPI.unassign(task.id, userId);
      setAssignees(assignees.filter((a) => a.userId !== userId));
      addToast('Member unassigned from task!');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to unassign', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await commentsAPI.create(task.id, newComment.trim());
      setNewComment('');
      // Real-time event will add it to the list
    } catch {
      addToast('Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsAPI.delete(commentId);
      // Real-time event will remove it
    } catch {
      addToast('Failed to delete comment', 'error');
    }
  };

  const handleAddLabel = async (labelId: string) => {
    try {
      const { data } = await labelsAPI.addToTask(task.id, labelId);
      setTaskLabels([...taskLabels, data.taskLabel]);
      addToast('Label added!');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to add label', 'error');
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await labelsAPI.removeFromTask(task.id, labelId);
      setTaskLabels(taskLabels.filter((tl) => tl.labelId !== labelId));
      addToast('Label removed!');
    } catch {
      addToast('Failed to remove label', 'error');
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const { data } = await labelsAPI.create(task.boardId, {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setBoardLabels([...boardLabels, data.label]);
      setNewLabelName('');
      addToast('Label created!');
    } catch {
      addToast('Failed to create label', 'error');
    }
  };

  const unassignedMembers = boardMembers.filter(
    (m) => !assignees.some((a) => a.userId === m.userId)
  );

  const unassignedLabels = boardLabels.filter(
    (l) => !taskLabels.some((tl) => tl.labelId === l.id)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="task-modal-body">
          <div className="form-group">
            <label><Flag size={14} /> Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              id="task-title-input"
            />
          </div>

          <div className="form-group">
            <label><AlignLeft size={14} /> Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              id="task-desc-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Flag size={14} /> Priority</label>
              <div className="priority-selector">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    className={`priority-option ${priority === p ? 'active' : ''}`}
                    style={{
                      '--priority-color': PRIORITY_COLORS[p],
                      backgroundColor: priority === p ? PRIORITY_COLORS[p] + '20' : undefined,
                      color: priority === p ? PRIORITY_COLORS[p] : undefined,
                      borderColor: priority === p ? PRIORITY_COLORS[p] : undefined,
                    } as React.CSSProperties}
                    onClick={() => setPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label><Calendar size={14} /> Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                id="task-date-input"
              />
            </div>
          </div>

          {/* Labels */}
          <div className="form-group">
            <label><Tag size={14} /> Labels</label>
            <div className="labels-list">
              {taskLabels.map((tl) => (
                <span
                  key={tl.id}
                  className="label-chip"
                  style={{ backgroundColor: tl.label.color + '25', color: tl.label.color, borderColor: tl.label.color + '40' }}
                >
                  {tl.label.name}
                  <button className="chip-remove" onClick={() => handleRemoveLabel(tl.labelId)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button className="assignee-add" onClick={() => setShowLabelPicker(!showLabelPicker)}>
                <Tag size={14} /> Add Label
              </button>
            </div>
            {showLabelPicker && (
              <div className="assign-dropdown label-dropdown">
                {unassignedLabels.map((l) => (
                  <button
                    key={l.id}
                    className="assign-option"
                    onClick={() => { handleAddLabel(l.id); setShowLabelPicker(false); }}
                  >
                    <span className="label-dot" style={{ backgroundColor: l.color }} />
                    <span>{l.name}</span>
                  </button>
                ))}
                <div className="label-create-row">
                  <input
                    type="text"
                    placeholder="New label name..."
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    className="label-create-input"
                  />
                  <div className="label-color-row">
                    {LABEL_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`color-swatch color-swatch-sm ${newLabelColor === c ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewLabelColor(c)}
                        type="button"
                      />
                    ))}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleCreateLabel} type="button">
                    <Plus size={12} /> Create
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Assignees */}
          <div className="form-group">
            <label><Users size={14} /> Assignees</label>
            <div className="assignees-list">
              {assignees.map((a) => (
                <div key={a.id} className="assignee-chip">
                  <div className="avatar avatar-xs">{a.user.name.charAt(0).toUpperCase()}</div>
                  <span>{a.user.name}</span>
                  <button className="chip-remove" onClick={() => handleUnassign(a.userId)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              {unassignedMembers.length > 0 && (
                <button className="assignee-add" onClick={() => setShowAssign(!showAssign)}>
                  <UserPlus size={14} /> Assign
                </button>
              )}
            </div>
            {showAssign && (
              <div className="assign-dropdown">
                {unassignedMembers.map((m) => (
                  <button
                    key={m.id}
                    className="assign-option"
                    onClick={() => { handleAssign(m.userId); setShowAssign(false); }}
                  >
                    <div className="avatar avatar-xs">{m.user.name.charAt(0).toUpperCase()}</div>
                    <span>{m.user.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="form-group comments-section">
            <label><MessageSquare size={14} /> Comments ({comments.length})</label>
            <form className="comment-form" onSubmit={handleAddComment}>
              <input
                ref={commentInputRef}
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                id="comment-input"
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!newComment.trim()}>
                <Send size={14} />
              </button>
            </form>
            <div className="comments-list">
              {commentsLoading ? (
                <div className="spinner-sm" style={{ margin: '8px auto' }} />
              ) : comments.length === 0 ? (
                <p className="comments-empty">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="avatar avatar-xs">{c.user.name.charAt(0).toUpperCase()}</div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">{c.user.name}</span>
                        <span className="comment-time">
                          {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="comment-text">{c.content}</p>
                    </div>
                    <button className="icon-btn icon-btn-sm comment-delete" onClick={() => handleDeleteComment(c.id)} title="Delete comment">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="task-meta">
            <span><Clock size={12} /> Created {new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)} id="delete-task-btn">
            <Trash2 size={14} /> Delete
          </button>
          <div className="modal-actions-right">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-task-btn">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
          confirmLabel="Delete Task"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
