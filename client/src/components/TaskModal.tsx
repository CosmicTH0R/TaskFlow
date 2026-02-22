import { useState, useEffect, useRef } from 'react';
import { Task, BoardMember, Comment, Label, TaskLabel } from '../types';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
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
import { motion, AnimatePresence } from 'framer-motion';

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
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [assignees, setAssignees] = useState(task.assignees);
  const [saving, setSaving] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user } = useAuthStore();
  const currentMember = boardMembers.find((m) => m.userId === user?.id);
  const currentRole = currentMember?.role || 'VIEWER';
  const canEdit = currentRole === 'OWNER' || currentRole === 'EDITOR';

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
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsAPI.delete(commentId);
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

  // Stagger animation for sections
  const sectionVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    }),
  };

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
          <motion.div className="space-y-2" custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
            <ShadcnLabel htmlFor="task-title-input">Title</ShadcnLabel>
            <Input
              id="task-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium"
              readOnly={!canEdit}
            />
          </motion.div>

          <motion.div className="space-y-2" custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
            <ShadcnLabel htmlFor="task-desc-input" className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4" /> Description
            </ShadcnLabel>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder={canEdit ? "Add a detailed description..." : "No description provided."}
              readOnly={!canEdit}
            />
          </motion.div>

          <motion.div className="grid grid-cols-2 gap-4" custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
            <div className="space-y-2">
              <ShadcnLabel className="flex items-center gap-2">
                <Flag className="w-4 h-4" /> Priority
              </ShadcnLabel>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <motion.div key={p} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant={priority === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => { if (canEdit) setPriority(p); }}
                      style={priority === p ? { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p], color: '#fff' } : { color: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }}
                      className={`transition-all duration-200 ${priority !== p && canEdit ? "hover:bg-transparent" : ""} ${!canEdit ? "cursor-default opacity-80" : "btn-press"}`}
                    >
                      {p}
                    </Button>
                  </motion.div>
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
                disabled={!canEdit}
              />
            </div>
          </motion.div>

          {/* Labels */}
          <motion.div className="space-y-2" custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
            <ShadcnLabel className="flex items-center gap-2"><Tag className="w-4 h-4" /> Labels</ShadcnLabel>
            <div className="flex flex-wrap items-center gap-2">
              <AnimatePresence>
                {taskLabels.map((tl) => (
                  <motion.span
                    key={tl.id}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: tl.label.color + '25', color: tl.label.color, border: `1px solid ${tl.label.color}40` }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                  >
                    {tl.label.name}
                    {canEdit && (
                      <button className="hover:text-foreground ml-1 transition-colors" onClick={() => handleRemoveLabel(tl.labelId)}>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </motion.span>
                ))}
              </AnimatePresence>

              {canEdit && (
                <div className="relative">
                  <Button variant="outline" size="sm" className="h-7 text-xs rounded-full btn-press" onClick={() => setShowLabelPicker(!showLabelPicker)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Label
                  </Button>

                <AnimatePresence>
                  {showLabelPicker && (
                    <motion.div
                      className="absolute top-full mt-2 left-0 w-64 p-3 bg-popover border rounded-md shadow-md z-50 flex flex-col gap-2"
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                        {unassignedLabels.map((l) => (
                          <button
                            key={l.id}
                            className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-sm text-sm text-left transition-colors"
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
                            <motion.button
                              key={c}
                              type="button"
                              className={`w-5 h-5 rounded-full border-2 ${newLabelColor === c ? 'border-primary' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                              onClick={() => setNewLabelColor(c)}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            />
                          ))}
                        </div>
                        <Button size="sm" onClick={handleCreateLabel} disabled={!newLabelName.trim()} type="button" className="h-8 w-full btn-press">
                          Create
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              )}
            </div>
          </motion.div>

          {/* Assignees */}
          <motion.div className="space-y-2" custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
            <ShadcnLabel className="flex items-center gap-2"><Users className="w-4 h-4" /> Assignees</ShadcnLabel>
            <div className="flex flex-wrap items-center gap-2">
              <AnimatePresence>
                {assignees.map((a) => (
                   <motion.div
                     key={a.id}
                     className="inline-flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-full text-sm"
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     layout
                   >
                     <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{a.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     <span>{a.user.name}</span>
                     {canEdit && (
                       <button className="hover:text-destructive text-muted-foreground transition-colors" onClick={() => handleUnassign(a.userId)}>
                         <X className="w-3.5 h-3.5" />
                       </button>
                     )}
                   </motion.div>
                ))}
              </AnimatePresence>

              {canEdit && unassignedMembers.length > 0 && (
                <div className="relative">
                  <Button variant="outline" size="sm" className="h-8 rounded-full btn-press" onClick={() => setShowAssign(!showAssign)}>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Assign
                  </Button>
                  <AnimatePresence>
                    {showAssign && (
                      <motion.div
                        className="absolute top-full mt-2 left-0 w-48 py-1 bg-popover border rounded-md shadow-md z-50"
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="max-h-48 overflow-y-auto">
                          {unassignedMembers.map((m) => (
                            <button
                              key={m.id}
                              className="flex items-center gap-2 w-full p-2 hover:bg-muted text-sm text-left transition-colors"
                              onClick={() => { handleAssign(m.userId); setShowAssign(false); }}
                            >
                              <Avatar className="w-5 h-5">
                                 <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{m.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span>{m.user.name}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* Comments */}
          <motion.div className="space-y-3 pt-4 border-t" custom={5} initial="hidden" animate="visible" variants={sectionVariants}>
            <ShadcnLabel className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments ({comments.length})</ShadcnLabel>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                ref={commentInputRef}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button type="submit" disabled={!newComment.trim()} className="btn-press">
                  <Send className="w-4 h-4" />
                </Button>
              </motion.div>
            </form>

            <div className="space-y-4 mt-4">
               {commentsLoading ? (
                 <div className="flex justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
               ) : comments.length === 0 ? (
                 <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first to comment!</p>
               ) : (
                 comments.map((c, index) => (
                   <motion.div
                     key={c.id}
                     className="flex gap-3 group"
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: index * 0.04, duration: 0.3 }}
                   >
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
                   </motion.div>
                 ))
               )}
            </div>
          </motion.div>

        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
          <Clock className="w-3.5 h-3.5" /> Created {new Date(task.createdAt).toLocaleDateString()}
        </div>

        <DialogFooter className="gap-2 sm:justify-between items-center sm:gap-0 mt-4 pt-4 border-t">
          {canEdit ? (
            <>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="btn-press">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                </Button>
              </motion.div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none btn-press">Cancel</Button>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 sm:flex-none">
                  <Button onClick={handleSave} disabled={saving} className="w-full btn-press">
                    <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </motion.div>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <Button variant="outline" onClick={onClose} className="btn-press">Close</Button>
            </div>
          )}
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
