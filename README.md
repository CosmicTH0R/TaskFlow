# TaskFlow — Real-Time Task Collaboration Platform

A full-stack, real-time Kanban-style task collaboration platform built as a lightweight Trello/Notion hybrid. Supports boards, lists, tasks, drag-and-drop, user assignment, real-time sync, and activity tracking.

![Tech](https://img.shields.io/badge/React-18-blue) ![Tech](https://img.shields.io/badge/Express-4-green) ![Tech](https://img.shields.io/badge/Socket.io-4-yellow) ![Tech](https://img.shields.io/badge/Prisma-5-purple) ![Tech](https://img.shields.io/badge/TypeScript-5-blue)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| State Management | Zustand |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Styling | Vanilla CSS (dark mode, glassmorphism) |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via Prisma ORM |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| Testing | Jest + Supertest |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd task-collab-platform

# --- Backend ---
cd server
npm install
npx prisma migrate dev --name init   # Creates SQLite database
npm run db:seed                       # Seeds demo data
npm run dev                           # Starts on http://localhost:3001

# --- Frontend (new terminal) ---
cd client
npm install
npm run dev                           # Starts on http://localhost:5173
```

### Demo Credentials

| User | Email | Password |
|---|---|---|
| Demo User | `demo@example.com` | `password123` |
| Alice Johnson | `alice@example.com` | `password123` |
| Bob Smith | `bob@example.com` | `password123` |

---

## 📐 Architecture

### Frontend Architecture

```
client/src/
├── main.tsx              # App entry, routing, auth guard
├── index.css             # Design system (dark mode, glass, animations)
├── types.ts              # TypeScript interfaces
├── services/
│   ├── api.ts            # Axios client + JWT interceptor
│   └── socket.ts         # Socket.io client management
├── store/
│   ├── authStore.ts      # Auth state (Zustand)
│   ├── boardStore.ts     # Board state + real-time handlers
│   └── toastStore.ts     # Toast notifications
├── pages/
│   ├── LoginPage.tsx     # Auth with demo fill
│   ├── DashboardPage.tsx # Board grid + search + create
│   └── BoardPage.tsx     # Kanban board with drag-and-drop
└── components/
    ├── TaskCard.tsx       # Task card display
    ├── SortableTaskCard.tsx # DnD wrapper
    ├── TaskModal.tsx      # Task edit modal
    ├── ActivitySidebar.tsx # Activity feed
    ├── ToastContainer.tsx # Global toast system
    └── ConfirmModal.tsx   # Custom confirm dialogs
```

**State Management**: Zustand stores with separate concerns:
- `authStore`: Auth tokens and user state
- `boardStore`: Board/list/task state + real-time handlers
- `toastStore`: Ephemeral UI notifications

**Drag & Drop**: Uses `@dnd-kit` with `PointerSensor`, `SortableContext`, and `DragOverlay` for smooth kanban drag-and-drop with optimistic updates.

### Backend Architecture

```
server/src/
├── index.ts              # Express + Socket.io server
├── socket.ts             # WebSocket room management
├── seed.ts               # Database seeder
├── middleware/
├── controllers/          # Business logic handlers
└── routes/               # Route definitions
```

**API Design**: RESTful with resource-based URLs. All endpoints require JWT auth via `Authorization: Bearer <token>` header. Routes are separated from controllers for cleaner architecture.

### Database Schema

```
┌──────────┐     ┌─────────────┐     ┌──────────┐
│   User   │────<│ BoardMember │>────│  Board   │
└──────────┘     └─────────────┘     └──────────┘
     │                                     │
     │           ┌──────────────┐    ┌─────┴────┐
     └──────────<│ TaskAssignee │>───│   Task   │>────│  List  │
                 └──────────────┘    └──────────┘     └────────┘
                                          │
                                    ┌─────┴────┐
                                    │ Activity │
                                    └──────────┘
```

- **User**: Auth + profile data
- **Board**: Workspace containing lists and tasks, with color theming
- **BoardMember**: Many-to-many with roles (OWNER/MEMBER)
- **List**: Ordered columns in a board
- **Task**: Cards with title, description, priority (LOW/MEDIUM/HIGH/URGENT), due date
- **TaskAssignee**: Many-to-many user-task assignment
- **Activity**: Immutable audit log per board

**Indexes**: Composite on `(listId, position)`, `(boardId, position)`, `(boardId, createdAt)`, unique on `(email)`.

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users?search=` | Search users |

### Boards

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards?page=&search=` | List user's boards (paginated) |
| GET | `/api/boards/:id` | Get board with lists & tasks |
| POST | `/api/boards` | Create board |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |
| POST | `/api/boards/:id/members` | Add member by email |
| DELETE | `/api/boards/:id/members/:userId` | Remove member |

### Lists

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/lists` | Create list |
| PUT | `/api/lists/:id` | Update list title |
| DELETE | `/api/lists/:id` | Delete list |
| PUT | `/api/lists/reorder` | Reorder lists |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks?boardId=&search=&page=` | Search tasks (paginated) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PUT | `/api/tasks/:id/move` | Move task (drag & drop) |
| POST | `/api/tasks/:id/assign` | Assign user |
| DELETE | `/api/tasks/:id/assign/:userId` | Unassign user |

### Activity

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/activity/boards/:boardId/activity?page=` | Get board activity log |

---

## 📡 Real-Time Sync Strategy

1. **Connection**: Client connects via Socket.io on login, auth'd via JWT in handshake.
2. **Room-based**: On entering a board, client joins room `board:<boardId>`.
3. **Event flow**:
   - User performs action → REST API call → server persists → responds to caller.
   - Server broadcasts event to board room (excluding originator).
   - Other connected clients receive event → Zustand store updated → UI re-renders.
4. **Optimistic updates**: Drag-and-drop updates UI immediately; rolls back on API error.
5. **Events**: `task:created`, `task:updated`, `task:deleted`, `task:moved`, `list:created`, `list:deleted`.

---

## 🧪 Testing

### Backend Tests (Jest)

```bash
cd server
npm test
```

### Frontend Tests (Vitest)

```bash
cd client
npm test
```

Tests cover:
- **Auth**: Signup/login flows, token verification
- **Board**: CRUD operations, access control
- **Tasks**: Creation, updates, assignment logic
- **Frontend Components**: TaskCard rendering, event handlers
- **State Management**: Zustand store actions and real-time updates

---

## 📈 Scalability Considerations

| Concern | Current | At Scale |
|---|---|---|
| Database | SQLite (single file) | PostgreSQL with read replicas |
| Real-time | Single Socket.io server | Redis adapter for multi-node |
| Auth | JWT (stateless) | Add refresh tokens + Redis blacklist |
| Search | SQL LIKE queries | Elasticsearch / Algolia |
| File storage | N/A | S3 for attachments |
| Caching | None | Redis for board data |
| Task ordering | Integer positions | Fractional indexing (LexoRank) |
| Deployment | Local | Docker Compose → Kubernetes |

---

## 🎯 Assumptions & Trade-offs

- **SQLite** chosen for zero-config local development. Easily swappable to PostgreSQL via Prisma.
- **No refresh tokens** — JWT expires in 7 days. Production would use refresh token rotation.
- **Integer positions** for ordering — works well at moderate scale. Fractional indexing (LexoRank) would avoid reorder writes at scale.
- **Broadcast all events** to board room — at scale, would need event granularity and selective updates.
- **No file uploads** — kept scope focused on core collaboration features.
- **No rate limiting** — would add express-rate-limit in production.

---

## ✨ Features

- ✅ JWT Authentication (signup/login)
- ✅ Board CRUD with color themes
- ✅ List management with reordering
- ✅ Task CRUD with priority and due dates
- ✅ Drag-and-drop across lists (optimistic)
- ✅ User assignment to tasks
- ✅ Real-time updates via WebSocket
- ✅ Activity history with pagination
- ✅ Board member management
- ✅ Search and pagination
- ✅ Premium dark UI with glassmorphism
- ✅ Responsive design
- ✅ API test coverage