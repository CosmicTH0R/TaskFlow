import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { joinBoard, leaveBoard, getSocket } from '../services/socket';
import ConfirmModal from '../components/ConfirmModal';
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
  DragOverlay
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from '../components/TaskCard';
import SortableTaskCard from '../components/SortableTaskCard';
import TaskModal from '../components/TaskModal';
import ActivitySidebar from '../components/ActivitySidebar';
import {
  ArrowLeft, Plus, Trash2,
  Users, Activity as ActivityIcon, UserPlus, X,
  Search, Keyboard
} from 'lucide-react';
import { Task } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ShortcutsHelp from '../components/ShortcutsHelp';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentBoard, lists, boardLoading,
    fetchBoard, clearBoard, createList, updateList, deleteList,
    createTask, moveTask,
    handleTaskCreated, handleTaskUpdated, handleTaskDeleted, handleTaskMoved,
    handleListCreated, handleListDeleted,
  } = useBoardStore();

  const [showActivity, setShowActivity] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingTaskListId, setAddingTaskListId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListTitle, setEditListTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [memberError, setMemberError] = useState('');
  const [confirmDeleteList, setConfirmDeleteList] = useState<string | null>(null);

  // Filter / sort state
  const [filterText, setFilterText] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'priority' | 'dueDate'>('position');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: () => {
      if (lists.length > 0) {
        setAddingTaskListId(lists[0].id);
        setTimeout(() => document.getElementById('new-task-input')?.focus(), 50);
      }
    },
    onCloseModal: () => {
      setSelectedTask(null);
      setShowMembers(false);
      setShowActivity(false);
      setShowShortcuts(false);
    },
    onFocusSearch: () => {
      document.getElementById('board-filter-input')?.focus();
    },
    onToggleHelp: () => setShowShortcuts((v) => !v),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (id) {
      fetchBoard(id);
      joinBoard(id);

      const socket = getSocket();
      if (socket) {
        socket.on('task:created', handleTaskCreated);
        socket.on('task:updated', handleTaskUpdated);
        socket.on('task:deleted', handleTaskDeleted);
        socket.on('task:moved', handleTaskMoved);
        socket.on('list:created', handleListCreated);
        socket.on('list:deleted', handleListDeleted);
      }

      return () => {
        leaveBoard(id);
        clearBoard();
        if (socket) {
          socket.off('task:created');
          socket.off('task:updated');
          socket.off('task:deleted');
          socket.off('task:moved');
          socket.off('list:created');
          socket.off('list:deleted');
        }
      };
    }
  }, [id]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = lists.flatMap(l => l.tasks).find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const taskId = String(active.id);
    const task = lists.flatMap(l => l.tasks).find(t => t.id === taskId);
    if (!task) return;

    const fromListId = task.listId;

    let toListId: string;
    let newPosition: number;

    const overTask = lists.flatMap(l => l.tasks).find(t => t.id === String(over.id));
    if (overTask) {
      toListId = overTask.listId;
      newPosition = overTask.position;
    } else {
      toListId = String(over.id);
      const targetList = lists.find(l => l.id === toListId);
      newPosition = targetList ? targetList.tasks.length : 0;
    }

    if (fromListId === toListId && task.position === newPosition) return;

    moveTask(taskId, fromListId, toListId, newPosition);
    toast.success('Task moved successfully!');
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !id) return;
    await createList(newListTitle, id);
    setNewListTitle('');
    setAddingList(false);
    toast.success('List created successfully!');
  };

  const handleUpdateList = async (listId: string) => {
    if (!editListTitle.trim()) return;
    await updateList(listId, editListTitle);
    setEditingListId(null);
    toast.success('List updated successfully!');
  };

  const handleDeleteList = async () => {
    if (!confirmDeleteList) return;
    await deleteList(confirmDeleteList);
    setConfirmDeleteList(null);
    toast.success('List deleted successfully!');
  };

  const handleCreateTask = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !id) return;
    await createTask(newTaskTitle, listId, id);
    setNewTaskTitle('');
    setAddingTaskListId(null);
    toast.success('Task created successfully!');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !id) return;
    try {
      const { boardsAPI } = await import('../services/api');
      await boardsAPI.addMember(id, newMemberEmail);
      setNewMemberEmail('');
      setMemberError('');
      fetchBoard(id);
      toast.success('Member added successfully!');
    } catch (err: any) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
      toast.error('Failed to add member');
    }
  };

  if (boardLoading || !currentBoard) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header
        className="flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-md border-b border-white/5 relative z-10 shadow-sm"
        style={{ borderTop: `4px solid ${currentBoard.color}` }}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} id="back-btn" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">{currentBoard.title}</h1>
            {currentBoard.description && <p className="text-sm text-muted-foreground mt-0.5">{currentBoard.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-2 mr-3 opacity-90 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => { setShowMembers(!showMembers); setShowActivity(false); }}>
            {currentBoard.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="w-8 h-8 border-2 border-card" title={m.user.name}>
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {m.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {currentBoard.members.length > 4 && (
               <Avatar className="w-8 h-8 border-2 border-card">
                 <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                   +{currentBoard.members.length - 4}
                 </AvatarFallback>
               </Avatar>
            )}
          </div>
          

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowActivity(!showActivity); setShowMembers(false); }}
            id="activity-btn"
            className={showActivity ? 'bg-primary/10 text-primary' : ''}
          >
            <ActivityIcon className="w-4 h-4 mr-2" /> Activity
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
            id="shortcuts-btn"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-muted/20 border-b border-white/5 relative z-10">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 bg-card/50 border-white/5 focus-visible:ring-1 focus-visible:ring-primary/50"
            placeholder="Filter tasks..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            id="board-filter-input"
          />
        </div>
        
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px] h-9 bg-card/50 border-white/5" id="priority-filter">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
          <SelectTrigger className="w-[140px] h-9 bg-card/50 border-white/5" id="sort-select">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="position">Default order</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="dueDate">Due date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Sheet open={showMembers} onOpenChange={setShowMembers}>
        <SheetContent side="right" className="w-[400px] border-l-border/50 bg-card p-0 flex flex-col">
          <SheetHeader className="p-6 border-b border-border/50 flex-none">
            <SheetTitle>Board Members</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="space-y-4">
              {currentBoard.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {m.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{m.user.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{m.role.toLowerCase()}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-border/50">
              <h4 className="text-sm font-medium mb-3">Add Member</h4>
              <form onSubmit={handleAddMember} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    id="add-member-input"
                    className="flex-1 bg-white/5"
                  />
                  <Button type="submit" id="add-member-btn" disabled={!newMemberEmail.trim()}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                {memberError && <p className="text-sm text-destructive">{memberError}</p>}
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 sm:gap-6 h-full items-start">
            {lists.map((list) => (
              <div 
                key={list.id} 
                className="w-[280px] sm:w-[320px] shrink-0 bg-secondary/30 backdrop-blur-md border border-white/5 rounded-xl flex flex-col max-h-full transition-colors hover:bg-secondary/40" 
                id={`list-${list.id}`}
              >
                <div className="p-3 sm:p-4 flex items-center justify-between group flex-none">
                  {editingListId === list.id ? (
                    <Input
                      value={editListTitle}
                      onChange={(e) => setEditListTitle(e.target.value)}
                      onBlur={() => handleUpdateList(list.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateList(list.id)}
                      autoFocus
                      className="h-8 py-1 px-2 text-sm font-semibold bg-background"
                    />
                  ) : (
                    <h3
                      className="text-sm font-semibold flex items-center gap-2 cursor-pointer hover:text-primary transition-colors flex-1"
                      onClick={() => { setEditingListId(list.id); setEditListTitle(list.title); }}
                    >
                      {list.title}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                        {list.tasks.length}
                      </span>
                    </h3>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDeleteList(list.id)}
                    title="Delete list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <SortableContext items={list.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-2 relative min-h-[50px] custom-scrollbar" id={list.id}>
                    {list.tasks
                      .filter(task => {
                        if (filterText && !task.title.toLowerCase().includes(filterText.toLowerCase()) &&
                            !(task.description || '').toLowerCase().includes(filterText.toLowerCase())) return false;
                        if (filterPriority && filterPriority !== 'all' && task.priority !== filterPriority) return false;
                        return true;
                      })
                      .sort((a, b) => {
                        if (sortBy === 'priority') {
                          const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                          return (order[a.priority as keyof typeof order] ?? 2) - (order[b.priority as keyof typeof order] ?? 2);
                        }
                        if (sortBy === 'dueDate') {
                          if (!a.dueDate && !b.dueDate) return 0;
                          if (!a.dueDate) return 1;
                          if (!b.dueDate) return -1;
                          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        }
                        return a.position - b.position;
                      })
                      .map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                      />
                    ))}
                  </div>
                </SortableContext>

                <div className="p-3 pt-1 flex-none border-t border-transparent">
                  {addingTaskListId === list.id ? (
                    <form onSubmit={(e) => handleCreateTask(e, list.id)} className="space-y-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        autoFocus
                        id="new-task-input"
                        className="h-9 bg-background/50 border-white/10"
                        onBlur={() => { if (!newTaskTitle.trim()) setAddingTaskListId(null); }}
                      />
                      <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" className="h-8">Add</Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-muted-foreground"
                          onClick={() => setAddingTaskListId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5 h-9 px-2"
                      onClick={() => { setAddingTaskListId(list.id); setNewTaskTitle(''); }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add task
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {addingList ? (
              <div className="w-[280px] sm:w-[320px] shrink-0 bg-card/40 backdrop-blur-md border border-white/5 rounded-xl p-3">
                <form onSubmit={handleCreateList} className="space-y-2">
                  <Input
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="List title..."
                    autoFocus
                    className="bg-background/50"
                    onBlur={() => { if (!newListTitle.trim()) setAddingList(false); }}
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" className="h-8">Add List</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground"
                      onClick={() => setAddingList(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-[280px] sm:w-[320px] shrink-0 h-12 justify-start text-muted-foreground/80 hover:text-foreground hover:bg-white/5 border border-dashed border-white/10"
                onClick={() => { setAddingList(true); setNewListTitle(''); }}
                id="add-list-btn"
              >
                <Plus className="w-5 h-5 mr-2" /> Add List
              </Button>
            )}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showActivity && currentBoard && (
        <ActivitySidebar boardId={currentBoard.id} onClose={() => setShowActivity(false)} />
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          boardMembers={currentBoard.members}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {confirmDeleteList && (
        <ConfirmModal
          title="Delete List"
          message="Are you sure you want to delete this list and all its tasks? This action cannot be undone."
          confirmLabel="Delete List"
          onConfirm={handleDeleteList}
          onCancel={() => setConfirmDeleteList(null)}
        />
      )}

      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
