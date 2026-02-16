import { useState } from 'react';
import { Task, BoardMember } from '../types';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import { tasksAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';
import {
  X, Flag, Calendar, AlignLeft, Users, Trash2, UserPlus,
  Save, Clock
} from 'lucide-react';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

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

  const unassignedMembers = boardMembers.filter(
    (m) => !assignees.some((a) => a.userId === m.userId)
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
