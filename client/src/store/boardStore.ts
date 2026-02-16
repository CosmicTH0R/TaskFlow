import { create } from 'zustand';
import { Board, List, Task, Activity, Pagination } from '../types';
import { boardsAPI, listsAPI, tasksAPI, activityAPI } from '../services/api';

interface BoardState {
  // Dashboard
  boards: Board[];
  boardsPagination: Pagination | null;
  boardsLoading: boolean;

  // Current board
  currentBoard: Board | null;
  lists: List[];
  boardLoading: boolean;

  // Activity
  activities: Activity[];
  activityPagination: Pagination | null;

  // Search
  searchQuery: string;

  // Dashboard actions
  fetchBoards: (page?: number, search?: string) => Promise<void>;
  createBoard: (title: string, description?: string, color?: string) => Promise<Board>;
  deleteBoard: (id: string) => Promise<void>;

  // Board detail actions
  fetchBoard: (id: string) => Promise<void>;
  clearBoard: () => void;

  // List actions
  createList: (title: string, boardId: string) => Promise<void>;
  updateList: (id: string, title: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  // Task actions
  createTask: (title: string, listId: string, boardId: string) => Promise<void>;
  updateTask: (id: string, data: { title?: string; description?: string; priority?: string; dueDate?: string | null }) => Promise<void>;
  deleteTask: (id: string, listId: string) => Promise<void>;
  moveTask: (taskId: string, fromListId: string, toListId: string, newPosition: number) => Promise<void>;

  // Real-time update handlers
  handleTaskCreated: (task: Task) => void;
  handleTaskUpdated: (task: Task) => void;
  handleTaskDeleted: (data: { taskId: string; listId: string }) => void;
  handleTaskMoved: (task: Task & { fromListId: string }) => void;
  handleListCreated: (list: List) => void;
  handleListDeleted: (listId: string) => void;

  // Activity
  fetchActivity: (boardId: string, page?: number) => Promise<void>;

  // Search
  setSearchQuery: (query: string) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  boardsPagination: null,
  boardsLoading: false,
  currentBoard: null,
  lists: [],
  boardLoading: false,
  activities: [],
  activityPagination: null,
  searchQuery: '',

  fetchBoards: async (page = 1, search) => {
    set({ boardsLoading: true });
    try {
      const { data } = await boardsAPI.list({ page, search });
      set({ boards: data.boards, boardsPagination: data.pagination, boardsLoading: false });
    } catch (err) {
      console.error('Fetch boards error:', err);
      set({ boardsLoading: false });
    }
  },

  createBoard: async (title, description, color) => {
    const { data } = await boardsAPI.create({ title, description, color });
    set((s) => ({ boards: [data.board, ...s.boards] }));
    return data.board;
  },

  deleteBoard: async (id) => {
    await boardsAPI.delete(id);
    set((s) => ({ boards: s.boards.filter((b) => b.id !== id) }));
  },

  fetchBoard: async (id) => {
    set({ boardLoading: true });
    try {
      const { data } = await boardsAPI.get(id);
      set({
        currentBoard: data.board,
        lists: data.board.lists || [],
        boardLoading: false,
      });
    } catch (err) {
      console.error('Fetch board error:', err);
      set({ boardLoading: false });
    }
  },

  clearBoard: () => set({ currentBoard: null, lists: [], activities: [] }),

  createList: async (title, boardId) => {
    const { data } = await listsAPI.create({ title, boardId });
    set((s) => ({
      lists: s.lists.some((l) => l.id === data.list.id)
        ? s.lists
        : [...s.lists, { ...data.list, tasks: [] }],
    }));
  },

  updateList: async (id, title) => {
    await listsAPI.update(id, { title });
    set((s) => ({
      lists: s.lists.map((l) => (l.id === id ? { ...l, title } : l)),
    }));
  },

  deleteList: async (id) => {
    await listsAPI.delete(id);
    set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }));
  },

  createTask: async (title, listId, boardId) => {
    const { data } = await tasksAPI.create({ title, listId, boardId });
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId && !l.tasks.some((t) => t.id === data.task.id)
          ? { ...l, tasks: [...l.tasks, data.task] }
          : l
      ),
    }));
  },

  updateTask: async (id, updateData) => {
    const { data } = await tasksAPI.update(id, updateData);
    set((s) => ({
      lists: s.lists.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) => (t.id === id ? data.task : t)),
      })),
    }));
  },

  deleteTask: async (id, listId) => {
    await tasksAPI.delete(id);
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId ? { ...l, tasks: l.tasks.filter((t) => t.id !== id) } : l
      ),
    }));
  },

  moveTask: async (taskId, fromListId, toListId, newPosition) => {
    // Optimistic update
    set((s) => {
      const newLists = s.lists.map((l) => ({ ...l, tasks: [...l.tasks] }));
      const fromList = newLists.find((l) => l.id === fromListId);
      const toList = newLists.find((l) => l.id === toListId);
      if (!fromList || !toList) return s;

      const taskIndex = fromList.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return s;

      const [task] = fromList.tasks.splice(taskIndex, 1);
      task.listId = toListId;
      task.position = newPosition;
      toList.tasks.splice(newPosition, 0, task);

      // Update positions
      fromList.tasks.forEach((t, i) => (t.position = i));
      toList.tasks.forEach((t, i) => (t.position = i));

      return { lists: newLists };
    });

    try {
      await tasksAPI.move(taskId, { listId: toListId, position: newPosition });
    } catch (err) {
      console.error('Move task error:', err);
      // Refresh board on error
      const board = get().currentBoard;
      if (board) get().fetchBoard(board.id);
    }
  },

  // Real-time handlers
  handleTaskCreated: (task) => {
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === task.listId && !l.tasks.some((t) => t.id === task.id)
          ? { ...l, tasks: [...l.tasks, task] }
          : l
      ),
    }));
  },

  handleTaskUpdated: (task) => {
    set((s) => ({
      lists: s.lists.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) => (t.id === task.id ? task : t)),
      })),
    }));
  },

  handleTaskDeleted: ({ taskId, listId }) => {
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) } : l
      ),
    }));
  },

  handleTaskMoved: (data) => {
    set((s) => {
      const newLists = s.lists.map((l) => ({ ...l, tasks: [...l.tasks] }));
      const fromList = newLists.find((l) => l.id === data.fromListId);
      const toList = newLists.find((l) => l.id === data.listId);
      if (fromList) {
        fromList.tasks = fromList.tasks.filter((t) => t.id !== data.id);
      }
      if (toList) {
        const taskWithoutMeta = { ...data } as any;
        delete taskWithoutMeta.fromListId;
        toList.tasks.splice(data.position, 0, taskWithoutMeta);
        toList.tasks.forEach((t, i) => (t.position = i));
      }
      return { lists: newLists };
    });
  },

  handleListCreated: (list) => {
    set((s) => ({
      lists: s.lists.some((l) => l.id === list.id)
        ? s.lists
        : [...s.lists, { ...list, tasks: list.tasks || [] }],
    }));
  },

  handleListDeleted: (listId) => {
    set((s) => ({ lists: s.lists.filter((l) => l.id !== listId) }));
  },

  fetchActivity: async (boardId, page = 1) => {
    try {
      const { data } = await activityAPI.getByBoard(boardId, page);
      set({
        activities: page === 1 ? data.activities : [...get().activities, ...data.activities],
        activityPagination: data.pagination,
      });
    } catch (err) {
      console.error('Fetch activity error:', err);
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
