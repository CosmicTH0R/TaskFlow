import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Search, LogOut, LayoutDashboard, Trash2, Users, ListTodo, StickyNote } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Label } from '../components/ui/label';
import { ThemeToggle } from '../components/ThemeToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition, FadeIn } from '../components/PageTransition';

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
    <PageTransition>
      <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
        <motion.header
          className="flex items-center justify-between px-6 py-4 bg-card border-b border-border shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </motion.div>
            <h1 className="text-xl font-bold">TaskFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <motion.div
              className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={() => navigate('/profile')}
              title="Profile settings"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarFallback className="bg-primary/20 text-primary">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{user?.name}</span>
            </motion.div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/notes')} title="Notes" id="notes-btn" className="text-muted-foreground hover:text-foreground btn-press">
              <StickyNote className="w-4 h-4 mr-2" /> Notes
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" id="logout-btn" className="text-muted-foreground hover:text-foreground btn-press">
              <LogOut className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </motion.header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <FadeIn delay={0.1} className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="relative w-full sm:max-w-md input-focus-glow rounded-md transition-shadow duration-300">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 w-full bg-card/50 transition-all duration-300"
              />
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto btn-press" id="create-board-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </Button>
            </motion.div>
          </FadeIn>

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
                      <motion.button
                        key={c}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewColor(c)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" className="btn-press">Create Board</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {boardsLoading ? (
            <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
          ) : boards.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-[50vh] gap-4 text-muted-foreground"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <LayoutDashboard className="w-16 h-16 opacity-50" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground">No boards yet</h2>
              <p className="text-sm">Create your first board to get started</p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => setShowCreate(true)} className="mt-4 btn-press">
                  <Plus className="w-4 h-4 mr-2" /> Create Board
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {boards.map((board, index) => (
                  <motion.div
                    key={board.id}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Card
                      className="overflow-hidden cursor-pointer card-hover-glow border-white/10 glass-panel"
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
                          <motion.button
                            className="absolute right-3 top-3 w-7 h-7 bg-black/20 text-white/80 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(board.id);
                            }}
                            title="Delete board"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
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
                  </motion.div>
                ))}
              </div>

              {boardsPagination && boardsPagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {Array.from({ length: boardsPagination.totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={boardsPagination.page === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0 btn-press"
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
    </PageTransition>
  );
}
