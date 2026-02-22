import { useState, useEffect, useRef } from 'react';
import { Task, BoardMember, Comment, Label, TaskLabel } from '../types';
import { useBoardStore } from '../store/boardStore';
import { toast } from 'sonner';
import { tasksAPI, commentsAPI, labelsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import ConfirmModal from './ConfirmModal';
import {
  X, Flag, Calendar, AlignLeft, Users, Trash2, UserPlus,
  Save, Clock, MessageSquare, Send, Tag, Plus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label as ShadcnLabel } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { RichTextEditor } from './RichTextEditor';

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
  // const addToast = useToastStore((s) => s.addToast);
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
    toast.success('Task updated successfully!');
    onClose();
  };

  const handleDelete = async () => {
    await deleteTask(task.id, task.listId);
    toast.success('Task deleted successfully!');
    onClose();
  };

  const handleAssign = async (userId: string) => {
    try {
      const { data } = await tasksAPI.assign(task.id, userId);
      setAssignees([...assignees, data.assignee]);
      toast.success('Member assigned to task!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      await tasksAPI.unassign(task.id, userId);
      setAssignees(assignees.filter((a) => a.userId !== userId));
      toast.success('Member unassigned from task!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to unassign');
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
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsAPI.delete(commentId);
      // Real-time event will remove it
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleAddLabel = async (labelId: string) => {
    try {
      const { data } = await labelsAPI.addToTask(task.id, labelId);
      setTaskLabels([...taskLabels, data.taskLabel]);
      toast.success('Label added!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add label');
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await labelsAPI.removeFromTask(task.id, labelId);
      setTaskLabels(taskLabels.filter((tl) => tl.labelId !== labelId));
      toast.success('Label removed!');
    } catch {
      toast.error('Failed to remove label');
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
      toast.success('Label created!');
    } catch {
      toast.error('Failed to create label');
    }
  };

  const unassignedMembers = boardMembers.filter(
    (m) => !assignees.some((a) => a.userId === m.userId)
  );

  const unassignedLabels = boardLabels.filter(
    (l) => !taskLabels.some((tl) => tl.labelId === l.id)
  );

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] gap-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4" /> 
            Edit Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <ShadcnLabel htmlFor="task-title-input">Title</ShadcnLabel>
            <Input
              id="task-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium"
            />
          </div>

          <div className="space-y-2">
            <ShadcnLabel htmlFor="task-desc-input" className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4" /> Description
            </ShadcnLabel>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add a detailed description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <ShadcnLabel className="flex items-center gap-2">
                <Flag className="w-4 h-4" /> Priority
              </ShadcnLabel>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <Button
                    key={p}
                    variant={priority === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriority(p)}
                    style={priority === p ? { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p], color: '#fff' } : { color: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }}
                    className={priority !== p ? "hover:bg-transparent" : ""}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <ShadcnLabel htmlFor="task-date-input" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Due Date
              </ShadcnLabel>
              <Input
                id="task-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <ShadcnLabel className="flex items-center gap-2"><Tag className="w-4 h-4" /> Labels</ShadcnLabel>
            <div className="flex flex-wrap items-center gap-2">
              {taskLabels.map((tl) => (
                <span
                  key={tl.id}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: tl.label.color + '25', color: tl.label.color, border: `1px solid ${tl.label.color}40` }}
                >
                  {tl.label.name}
                  <button className="hover:text-foreground ml-1" onClick={() => handleRemoveLabel(tl.labelId)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              
              <div className="relative">
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => setShowLabelPicker(!showLabelPicker)}>
                  <Plus className="w-3 h-3 mr-1" /> Add Label
                </Button>
                
                {showLabelPicker && (
                  <div className="absolute top-full mt-2 left-0 w-64 p-3 bg-popover border rounded-md shadow-md z-50 flex flex-col gap-2">
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                      {unassignedLabels.map((l) => (
                        <button
                          key={l.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-sm text-sm text-left"
                          onClick={() => { handleAddLabel(l.id); setShowLabelPicker(false); }}
                        >
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                          <span>{l.name}</span>
                        </button>
                      ))}
                      {unassignedLabels.length === 0 && <span className="text-xs text-muted-foreground p-1">No labels available to add.</span>}
                    </div>
                    
                    <div className="pt-2 border-t mt-1 flex flex-col gap-2">
                      <Input
                        placeholder="New label name..."
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {LABEL_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`w-5 h-5 rounded-full border-2 ${newLabelColor === c ? 'border-primary' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setNewLabelColor(c)}
                          />
                        ))}
                      </div>
                      <Button size="sm" onClick={handleCreateLabel} disabled={!newLabelName.trim()} type="button" className="h-8 w-full">
                        Create
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <ShadcnLabel className="flex items-center gap-2"><Users className="w-4 h-4" /> Assignees</ShadcnLabel>
            <div className="flex flex-wrap items-center gap-2">
              {assignees.map((a) => (
                 <div key={a.id} className="inline-flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-full text-sm">
                    <Avatar className="w-5 h-5">
                       <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{a.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{a.user.name}</span>
                    <button className="hover:text-destructive text-muted-foreground" onClick={() => handleUnassign(a.userId)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                 </div>
              ))}

              {unassignedMembers.length > 0 && (
                <div className="relative">
                  <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={() => setShowAssign(!showAssign)}>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Assign
                  </Button>
                  {showAssign && (
                    <div className="absolute top-full mt-2 left-0 w-48 py-1 bg-popover border rounded-md shadow-md z-50">
                      <div className="max-h-48 overflow-y-auto">
                        {unassignedMembers.map((m) => (
                          <button
                            key={m.id}
                            className="flex items-center gap-2 w-full p-2 hover:bg-muted text-sm text-left"
                            onClick={() => { handleAssign(m.userId); setShowAssign(false); }}
                          >
                            <Avatar className="w-5 h-5">
                               <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{m.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{m.user.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-3 pt-4 border-t">
            <ShadcnLabel className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments ({comments.length})</ShadcnLabel>
            
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                ref={commentInputRef}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button type="submit" disabled={!newComment.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>

            <div className="space-y-4 mt-4">
               {commentsLoading ? (
                 <div className="flex justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
               ) : comments.length === 0 ? (
                 <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first to comment!</p>
               ) : (
                 comments.map((c) => (
                   <div key={c.id} className="flex gap-3 group">
                     <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{c.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 space-y-1">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className="text-sm font-semibold">{c.user.name}</span>
                           <span className="text-xs text-muted-foreground">
                             {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </span>
                         </div>
                         <Button type="button" variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" onClick={() => handleDeleteComment(c.id)}>
                           <Trash2 className="w-3.5 h-3.5" />
                         </Button>
                       </div>
                       <p className="text-sm text-foreground bg-muted/50 p-2.5 rounded-md leading-relaxed">{c.content}</p>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>

        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
          <Clock className="w-3.5 h-3.5" /> Created {new Date(task.createdAt).toLocaleDateString()}
        </div>

        <DialogFooter className="gap-2 sm:justify-between items-center sm:gap-0 mt-4 pt-4 border-t">
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
          </Button>
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
              <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
          confirmLabel="Delete Task"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </Dialog>
  );
}
