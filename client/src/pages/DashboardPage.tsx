import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Search, LogOut, LayoutDashboard, Trash2, Users, ListTodo } from 'lucide-react';

const BOARD_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { boards, boardsPagination, boardsLoading, fetchBoards, createBoard, deleteBoard } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards(1);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    fetchBoards(1, q || undefined);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createBoard(newTitle, newDesc || undefined, newColor);
    setNewTitle('');
    setNewDesc('');
    setNewColor('#6366f1');
    setShowCreate(false);
    addToast('Board created successfully!');
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteBoard(confirmDelete);
    setConfirmDelete(null);
    addToast('Board deleted successfully!');
  };

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully!', 'info');
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-left">
          <LayoutDashboard size={28} className="header-logo" />
          <h1>TaskFlow</h1>
        </div>
        <div className="header-right">
          <div className="user-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} title="Profile settings">
            <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <span>{user?.name}</span>
          </div>
          <button className="icon-btn" onClick={handleLogout} title="Logout" id="logout-btn">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-toolbar">
          <div className="search-bar" id="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              id="search-input"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
            id="create-board-btn"
          >
            <Plus size={18} />
            New Board
          </button>
        </div>

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create New Board</h2>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Board title"
                    autoFocus
                    required
                    id="new-board-title"
                  />
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="What is this board for?"
                    id="new-board-desc"
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker">
                    {BOARD_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`color-swatch ${newColor === c ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" id="submit-board">
                    Create Board
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {boardsLoading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : boards.length === 0 ? (
          <div className="empty-state">
            <LayoutDashboard size={64} />
            <h2>No boards yet</h2>
            <p>Create your first board to get started</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={18} /> Create Board
            </button>
          </div>
        ) : (
          <>
            <div className="boards-grid">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="board-card"
                  style={{ '--board-color': board.color } as React.CSSProperties}
                  onClick={() => navigate(`/board/${board.id}`)}
                  id={`board-${board.id}`}
                >
                  <div className="board-card-header" style={{ background: board.color }}>
                    <h3>{board.title}</h3>
                    {board.ownerId === user?.id && (
                      <button
                        className="board-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(board.id);
                        }}
                        title="Delete board"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="board-card-body">
                    {board.description && <p className="board-desc">{board.description}</p>}
                    <div className="board-meta">
                      <span><ListTodo size={14} /> {board._count?.tasks || 0} tasks</span>
                      <span><Users size={14} /> {board.members.length} members</span>
                    </div>
                    <div className="board-members">
                      {board.members.slice(0, 5).map((m) => (
                        <div key={m.id} className="avatar avatar-sm" title={m.user.name}>
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {board.members.length > 5 && (
                        <div className="avatar avatar-sm avatar-more">+{board.members.length - 5}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {boardsPagination && boardsPagination.totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: boardsPagination.totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`pagination-btn ${boardsPagination.page === i + 1 ? 'active' : ''}`}
                    onClick={() => fetchBoards(i + 1, searchQuery || undefined)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Board"
          message="Are you sure you want to delete this board? All lists and tasks will be permanently removed."
          confirmLabel="Delete Board"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
