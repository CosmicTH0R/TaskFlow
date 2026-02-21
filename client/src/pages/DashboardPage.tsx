import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Search, LogOut, LayoutDashboard, Trash2, Users, ListTodo } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';

const BOARD_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { boards, boardsPagination, boardsLoading, fetchBoards, createBoard, deleteBoard } = useBoardStore();
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
    toast.success('Board created successfully!');
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteBoard(confirmDelete);
    setConfirmDelete(null);
    toast.success('Board deleted successfully!');
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully!');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">TaskFlow</h1>
        </div>
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => navigate('/profile')} 
            title="Profile settings"
          >
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarFallback className="bg-primary/20 text-primary">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{user?.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" id="logout-btn" className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 w-full bg-card/50"
            />
          </div>
          <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto" id="create-board-btn">
            <Plus className="w-4 h-4 mr-2" />
            New Board
          </Button>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Board title"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <textarea
                  id="desc"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this board for?"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap pb-2">
                  {BOARD_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit">Create Board</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {boardsLoading ? (
          <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-muted-foreground">
            <LayoutDashboard className="w-16 h-16 opacity-50" />
            <h2 className="text-xl font-semibold text-foreground">No boards yet</h2>
            <p className="text-sm">Create your first board to get started</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4">
              <Plus className="w-4 h-4 mr-2" /> Create Board
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {boards.map((board) => (
                <Card
                  key={board.id}
                  className="overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-white/10 glass-panel"
                  onClick={() => navigate(`/board/${board.id}`)}
                >
                  <div 
                    className="p-4 flex items-start justify-between min-h-[80px] relative group"
                    style={{ backgroundColor: board.color }}
                  >
                    <h3 className="font-semibold text-white drop-shadow-md truncate pr-8">
                      {board.title}
                    </h3>
                    {board.ownerId === user?.id && (
                      <button
                        className="absolute right-3 top-3 w-7 h-7 bg-black/20 text-white/80 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(board.id);
                        }}
                        title="Delete board"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <CardContent className="p-4 pt-5">
                    {board.description && <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{board.description}</p>}
                    <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><ListTodo className="w-3.5 h-3.5" /> {board._count?.tasks || 0} tasks</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {board.members.length} members</span>
                    </div>
                    <div className="flex items-center -space-x-2">
                      {board.members.slice(0, 5).map((m) => (
                        <Avatar key={m.id} className="w-7 h-7 border-2 border-card" title={m.user.name}>
                          <AvatarFallback className="text-[10px] bg-primary text-white">{m.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      ))}
                      {board.members.length > 5 && (
                        <Avatar className="w-7 h-7 border-2 border-card">
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">+{board.members.length - 5}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {boardsPagination && boardsPagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                {Array.from({ length: boardsPagination.totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={boardsPagination.page === i + 1 ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => fetchBoards(i + 1, searchQuery || undefined)}
                  >
                    {i + 1}
                  </Button>
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
