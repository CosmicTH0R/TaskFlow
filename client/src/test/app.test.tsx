import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import { Task } from '../types';

// Mock task data
const mockTask: Task = {
  id: 'task-1',
  title: 'Implement login page',
  description: 'Build the authentication UI with email and password fields',
  listId: 'list-1',
  boardId: 'board-1',
  position: 0,
  priority: 'HIGH',
  dueDate: '2026-02-20T00:00:00.000Z',
  createdAt: '2026-02-15T00:00:00.000Z',
  updatedAt: '2026-02-15T00:00:00.000Z',
  assignees: [
    {
      id: 'assign-1',
      taskId: 'task-1',
      userId: 'user-1',
      assignedAt: '2026-02-15T00:00:00.000Z',
      user: { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com' },
    },
  ],
};

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Implement login page')).toBeInTheDocument();
  });

  it('renders task description (truncated)', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText(/Build the authentication UI/)).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('renders due date', () => {
    render(<TaskCard task={mockTask} />);
    // Date format depends on locale, just check for date content
    const dateEl = document.querySelector('.task-due');
    expect(dateEl).toBeInTheDocument();
  });

  it('renders assignee avatars', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('A')).toBeInTheDocument(); // Avatar initial
  });

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={onClick} />);
    fireEvent.click(screen.getByText('Implement login page'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders without assignees gracefully', () => {
    const noAssignees = { ...mockTask, assignees: [] };
    render(<TaskCard task={noAssignees} />);
    expect(screen.getByText('Implement login page')).toBeInTheDocument();
    expect(document.querySelector('.task-assignees')).toBeNull();
  });

  it('renders without description gracefully', () => {
    const noDesc = { ...mockTask, description: undefined };
    render(<TaskCard task={noDesc} />);
    expect(screen.getByText('Implement login page')).toBeInTheDocument();
    expect(document.querySelector('.task-desc')).toBeNull();
  });

  it('renders without due date gracefully', () => {
    const noDue = { ...mockTask, dueDate: undefined };
    render(<TaskCard task={noDue} />);
    expect(document.querySelector('.task-due')).toBeNull();
  });
});

describe('Auth Store', () => {
  it('starts with null user and token from localStorage', async () => {
    const { useAuthStore } = await import('../store/authStore');
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('clearError clears the error state', async () => {
    const { useAuthStore } = await import('../store/authStore');
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});

describe('Board Store', () => {
  it('starts with empty state', async () => {
    const { useBoardStore } = await import('../store/boardStore');
    const state = useBoardStore.getState();
    expect(state.boards).toEqual([]);
    expect(state.currentBoard).toBeNull();
    expect(state.lists).toEqual([]);
    expect(state.activities).toEqual([]);
  });

  it('handleTaskCreated adds task to correct list', async () => {
    const { useBoardStore } = await import('../store/boardStore');
    useBoardStore.setState({
      lists: [
        { id: 'list-1', title: 'To Do', boardId: 'b1', position: 0, tasks: [], createdAt: '2026-01-01T00:00:00Z' },
        { id: 'list-2', title: 'Done', boardId: 'b1', position: 1, tasks: [], createdAt: '2026-01-01T00:00:00Z' },
      ],
    });

    useBoardStore.getState().handleTaskCreated(mockTask);

    const state = useBoardStore.getState();
    expect(state.lists[0].tasks).toHaveLength(1);
    expect(state.lists[0].tasks[0].id).toBe('task-1');
    expect(state.lists[1].tasks).toHaveLength(0);
  });

  it('handleTaskDeleted removes task from list', async () => {
    const { useBoardStore } = await import('../store/boardStore');
    useBoardStore.setState({
      lists: [{ id: 'list-1', title: 'To Do', boardId: 'b1', position: 0, tasks: [mockTask], createdAt: '2026-01-01T00:00:00Z' }],
    });

    useBoardStore.getState().handleTaskDeleted({ taskId: 'task-1', listId: 'list-1' });
    expect(useBoardStore.getState().lists[0].tasks).toHaveLength(0);
  });

  it('handleListCreated adds new list', async () => {
    const { useBoardStore } = await import('../store/boardStore');
    useBoardStore.setState({ lists: [] });
    useBoardStore.getState().handleListCreated({
      id: 'list-new',
      title: 'New List',
      boardId: 'b1',
      position: 0,
      tasks: [],
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(useBoardStore.getState().lists).toHaveLength(1);
    expect(useBoardStore.getState().lists[0].title).toBe('New List');
  });

  it('handleListDeleted removes list', async () => {
    const { useBoardStore } = await import('../store/boardStore');
    useBoardStore.setState({
      lists: [{ id: 'list-1', title: 'To Do', boardId: 'b1', position: 0, tasks: [], createdAt: '2026-01-01T00:00:00Z' }],
    });
    useBoardStore.getState().handleListDeleted('list-1');
    expect(useBoardStore.getState().lists).toHaveLength(0);
  });

  it('handleTaskUpdated updates task in list', async () => {
    const { useBoardStore } = await import('../store/boardStore');
    useBoardStore.setState({
      lists: [{ id: 'list-1', title: 'To Do', boardId: 'b1', position: 0, tasks: [mockTask], createdAt: '2026-01-01T00:00:00Z' }],
    });

    const updated = { ...mockTask, title: 'Updated Title' };
    useBoardStore.getState().handleTaskUpdated(updated);
    expect(useBoardStore.getState().lists[0].tasks[0].title).toBe('Updated Title');
  });

  it('setSearchQuery updates the search query', async () => {
    const { useBoardStore } = await import('../store/boardStore');
    useBoardStore.getState().setSearchQuery('test query');
    expect(useBoardStore.getState().searchQuery).toBe('test query');
  });

  it('clearBoard resets board state', async () => {
    const { useBoardStore } = await import('../store/boardStore');
    useBoardStore.setState({
      currentBoard: { id: 'b1' } as any,
      lists: [{ id: 'l1' } as any],
      activities: [{ id: 'a1' } as any],
    });
    useBoardStore.getState().clearBoard();
    const state = useBoardStore.getState();
    expect(state.currentBoard).toBeNull();
    expect(state.lists).toEqual([]);
    expect(state.activities).toEqual([]);
  });
});
