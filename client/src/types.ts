export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  color: string;
  ownerId: string;
  owner: User;
  members: BoardMember[];
  lists?: List[];
  _count?: { tasks: number; lists: number };
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: User;
  joinedAt: string;
}

export interface List {
  id: string;
  title: string;
  boardId: string;
  position: number;
  tasks: Task[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  position: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignees: TaskAssignee[];
  labels?: TaskLabel[];
  list?: { id: string; title: string };
  subTasks?: SubTask[];
  dependencies?: TaskDependency[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  assignedAt: string;
}

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  label: Label;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  boardId: string;
  userId: string;
  taskId?: string;
  action: string;
  details?: string;
  user: User;
  task?: { id: string; title: string };
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  taskId: string;
  createdAt: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOn: { id: string; title: string; listId: string };
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  emoji: string;
  userId: string;
  boardId?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}
