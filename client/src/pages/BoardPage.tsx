import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
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
  Search, Filter, Keyboard
} from 'lucide-react';
import { Task } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ShortcutsHelp from '../components/ShortcutsHelp';

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
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
    addToast('Task moved successfully!');
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !id) return;
    await createList(newListTitle, id);
    setNewListTitle('');
    setAddingList(false);
    addToast('List created successfully!');
  };

  const handleUpdateList = async (listId: string) => {
    if (!editListTitle.trim()) return;
    await updateList(listId, editListTitle);
    setEditingListId(null);
    addToast('List updated successfully!');
  };

  const handleDeleteList = async () => {
    if (!confirmDeleteList) return;
    await deleteList(confirmDeleteList);
    setConfirmDeleteList(null);
    addToast('List deleted successfully!');
  };

  const handleCreateTask = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !id) return;
    await createTask(newTaskTitle, listId, id);
    setNewTaskTitle('');
    setAddingTaskListId(null);
    addToast('Task created successfully!');
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
      addToast('Member added successfully!');
    } catch (err: any) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
      addToast('Failed to add member', 'error');
    }
  };

  if (boardLoading || !currentBoard) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="board-page">
      <header className="board-header" style={{ '--board-color': currentBoard.color } as React.CSSProperties}>
        <div className="header-left">
          <button className="icon-btn" onClick={() => navigate('/')} id="back-btn">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{currentBoard.title}</h1>
            {currentBoard.description && <p className="board-subtitle">{currentBoard.description}</p>}
          </div>
        </div>
        <div className="header-right">
          <div className="board-members-row">
            {currentBoard.members.slice(0, 4).map((m) => (
              <div key={m.id} className="avatar avatar-sm" title={m.user.name}>
                {m.user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowMembers(!showMembers); setShowActivity(false); }} id="members-btn">
            <Users size={16} /> Members
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setShowActivity(!showActivity); setShowMembers(false); }}
            id="activity-btn"
          >
            <ActivityIcon size={16} /> Activity
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
            id="shortcuts-btn"
          >
            <Keyboard size={16} />
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="board-filter-bar">
        <div className="filter-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Filter tasks..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            id="board-filter-input"
          />
        </div>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="filter-select" id="priority-filter">
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="filter-select" id="sort-select">
          <option value="position">Default order</option>
          <option value="priority">Priority</option>
          <option value="dueDate">Due date</option>
        </select>
      </div>

      {showMembers && (
        <div className="members-panel">
          <div className="panel-header">
            <h3>Board Members</h3>
            <button className="icon-btn" onClick={() => setShowMembers(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="members-list">
            {currentBoard.members.map((m) => (
              <div key={m.id} className="member-item">
                <div className="avatar avatar-sm">{m.user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <span className="member-name">{m.user.name}</span>
                  <span className="member-role">{m.role}</span>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddMember} className="add-member-form">
            <input
              type="email"
              placeholder="Add member by email..."
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              id="add-member-input"
            />
            <button type="submit" className="btn btn-primary btn-sm" id="add-member-btn">
              <UserPlus size={14} /> Add
            </button>
          </form>
          {memberError && <p className="error-text">{memberError}</p>}
        </div>
      )}

      <div className="board-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="lists-container">
            {lists.map((list) => (
              <div key={list.id} className="list-column" id={`list-${list.id}`}>
                <div className="list-header">
                  {editingListId === list.id ? (
                    <div className="inline-edit">
                      <input
                        value={editListTitle}
                        onChange={(e) => setEditListTitle(e.target.value)}
                        onBlur={() => handleUpdateList(list.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateList(list.id)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <h3
                      onClick={() => { setEditingListId(list.id); setEditListTitle(list.title); }}
                    >
                      {list.title}
                      <span className="task-count">{list.tasks.length}</span>
                    </h3>
                  )}
                  <div className="list-actions">
                    <button
                      className="icon-btn icon-btn-sm"
                      onClick={() => setConfirmDeleteList(list.id)}
                      title="Delete list"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <SortableContext items={list.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="tasks-container" id={list.id}>
                    {list.tasks
                      .filter(task => {
                        if (filterText && !task.title.toLowerCase().includes(filterText.toLowerCase()) &&
                            !(task.description || '').toLowerCase().includes(filterText.toLowerCase())) return false;
                        if (filterPriority && task.priority !== filterPriority) return false;
                        return true;
                      })
                      .sort((a, b) => {
                        if (sortBy === 'priority') {
                          const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                          return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
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

                {addingTaskListId === list.id ? (
                  <form onSubmit={(e) => handleCreateTask(e, list.id)} className="add-task-form">
                    <input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title..."
                      autoFocus
                      id="new-task-input"
                      onBlur={() => { if (!newTaskTitle.trim()) setAddingTaskListId(null); }}
                    />
                    <div className="add-task-actions">
                      <button type="submit" className="btn btn-primary btn-sm">Add</button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm"
                        onClick={() => setAddingTaskListId(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="add-task-btn"
                    onClick={() => { setAddingTaskListId(list.id); setNewTaskTitle(''); }}
                  >
                    <Plus size={16} /> Add task
                  </button>
                )}
              </div>
            ))}

            {addingList ? (
              <div className="list-column list-column-new">
                <form onSubmit={handleCreateList}>
                  <input
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="List title..."
                    autoFocus
                    onBlur={() => { if (!newListTitle.trim()) setAddingList(false); }}
                  />
                  <div className="add-task-actions">
                    <button type="submit" className="btn btn-primary btn-sm">Add List</button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm"
                      onClick={() => setAddingList(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                className="add-list-btn"
                onClick={() => { setAddingList(true); setNewListTitle(''); }}
                id="add-list-btn"
              >
                <Plus size={18} /> Add List
              </button>
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
