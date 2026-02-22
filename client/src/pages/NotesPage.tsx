import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { RichTextEditor } from '../components/RichTextEditor';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import {
  ArrowLeft, Plus, Search, Trash2, FileText, StickyNote, Pencil, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '../components/PageTransition';
import { ThemeToggle } from '../components/ThemeToggle';
import { Note } from '../types';

const EMOJI_OPTIONS = ['📝', '💡', '🎯', '🔥', '📌', '🚀', '✅', '📚', '💻', '🎨', '📊', '⭐', '🧠', '📋', '🔧', '💬', '🌟', '📎'];

export default function NotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const boardId = searchParams.get('boardId');
  const { user } = useAuthStore();
  const { currentBoard, fetchBoard } = useBoardStore();
  const {
    notes, currentNote, notesLoading,
    fetchNotes, createNote, updateNote, deleteNote,
    setCurrentNote, searchQuery, setSearchQuery,
  } = useNotesStore();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const currentNoteRef = useRef(currentNote);

  useEffect(() => {
    fetchNotes(undefined, boardId || undefined);
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId]);

  useEffect(() => {
    if (currentNote) {
      setTitleValue(currentNote.title);
    }
    currentNoteRef.current = currentNote;
  }, [currentNote?.id]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    fetchNotes(q || undefined, boardId || undefined);
  };

  const handleCreate = async (parentId?: string) => {
    const note = await createNote(boardId || undefined, parentId);
    if (note) {
      toast.success('Note created!');
      setTitleValue('Untitled');
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  };

  useEffect(() => {
    const handleSubPage = () => {
      const note = currentNoteRef.current;
      if (note) {
        handleCreate(note.id);
      }
    };
    window.addEventListener('CREATE_SUB_PAGE', handleSubPage);
    return () => window.removeEventListener('CREATE_SUB_PAGE', handleSubPage);
  }, [boardId, createNote]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteNote(confirmDelete);
    setConfirmDelete(null);
    toast.success('Note deleted!');
  };

  const debouncedSave = useCallback((id: string, data: { title?: string; content?: string; emoji?: string }) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateNote(id, data);
    }, 500);
  }, [updateNote]);

  const handleContentChange = (html: string) => {
    if (!currentNote) return;
    debouncedSave(currentNote.id, { content: html });
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!currentNote) return;
    updateNote(currentNote.id, { emoji });
    setShowEmojis(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sidebar only shows top-level notes (no parentId)
  const topLevelNotes = filteredNotes.filter(n => !n.parentId);

  // Get sub-pages of the current note
  const childNotes = currentNote ? notes.filter(n => n.parentId === currentNote.id) : [];

  // Build breadcrumb trail for navigation
  const getBreadcrumbs = (note: Note): Note[] => {
    const trail: Note[] = [note];
    let current = note;
    while (current.parentId) {
      const parent = notes.find(n => n.id === current.parentId);
      if (!parent) break;
      trail.unshift(parent);
      current = parent;
    }
    return trail;
  };

  const breadcrumbs = currentNote ? getBreadcrumbs(currentNote) : [];

  return (
    <PageTransition>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        {/* Header */}
        <motion.header
          className="flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-md border-b border-white/5 relative z-10 shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(boardId ? `/board/${boardId}` : '/')}
              className="text-muted-foreground hover:text-foreground btn-press"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">
                {boardId ? `${currentBoard?.title || 'Board'} Notes` : 'Personal Notes'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <ThemeToggle />
          </div>
        </motion.header>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <motion.aside
            className="w-[300px] bg-card/40 backdrop-blur-md border-r border-white/5 flex flex-col shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Sidebar header */}
            <div className="p-4 space-y-3">
              <Button
                onClick={() => handleCreate()}
                className="w-full btn-press"
                id="create-note-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> New Note
              </Button>
              <div className="relative input-focus-glow rounded-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-9 bg-background/50 border-white/5"
                />
              </div>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
              {notesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="spinner" />
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <p>No notes yet</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {topLevelNotes.map((note, i) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className={`group flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                        currentNote?.id === note.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                      onClick={() => setCurrentNote(note)}
                    >
                      <span className="text-lg mt-0.5 shrink-0 select-none">{note.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{note.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(note.updatedAt)}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center shrink-0">
                        <button
                          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentNote(note);
                            setTitleValue(note.title);
                            setTimeout(() => titleInputRef.current?.focus(), 50);
                          }}
                          title="Rename note"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(note.id); }}
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.aside>

          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto">
            {currentNote ? (
              <motion.div
                key={currentNote.id}
                className="max-w-3xl mx-auto px-8 py-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Breadcrumb Navigation */}
                {breadcrumbs.length > 1 && (
                  <nav className="flex items-center gap-1 mb-4 text-sm text-muted-foreground flex-wrap">
                    {breadcrumbs.map((crumb, idx) => (
                      <React.Fragment key={crumb.id}>
                        {idx > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />}
                        <button
                          className={`px-1.5 py-0.5 rounded transition-colors hover:bg-white/10 ${
                            crumb.id === currentNote.id ? 'text-foreground' : 'hover:text-foreground'
                          }`}
                          onClick={() => setCurrentNote(crumb)}
                        >
                          {crumb.title}
                        </button>
                      </React.Fragment>
                    ))}
                  </nav>
                )}

                {/* Title */}
                <div className="group/title relative mb-1">
                  <div className="flex items-start gap-2">
                    <button
                      className="text-3xl mt-1 hover:scale-110 transition-transform duration-200 cursor-pointer select-none shrink-0"
                      onClick={() => setShowEmojis(!showEmojis)}
                      title="Change icon"
                    >
                      {currentNote.emoji}
                    </button>
                    <input
                      ref={titleInputRef}
                      className="text-4xl font-bold bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground/30 p-0 focus:ring-0"
                      value={titleValue}
                      onChange={(e) => {
                        setTitleValue(e.target.value);
                        debouncedSave(currentNote.id, { title: e.target.value });
                      }}
                      onBlur={(e) => {
                        if (currentNote && e.target.value.trim() !== currentNote.title) {
                          updateNote(currentNote.id, { title: e.target.value.trim() });
                        }
                      }}
                      placeholder="Untitled"
                    />
                  </div>
                  <AnimatePresence>
                    {showEmojis && (
                      <motion.div
                        className="absolute top-full left-0 mt-1 p-3 bg-card border border-white/10 rounded-xl shadow-xl z-50 grid grid-cols-6 gap-1.5"
                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        {EMOJI_OPTIONS.map((e) => (
                          <button
                            key={e}
                            className="text-2xl p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => handleEmojiSelect(e)}
                          >
                            {e}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sub-pages — Notion-style simple linked rows */}
                {childNotes.length > 0 && (
                  <div className="mb-4">
                    {childNotes.map(child => (
                      <div
                        key={child.id}
                        className="group/sub w-full flex items-center gap-2.5 px-1 py-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
                      >
                        <button
                          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                          onClick={() => setCurrentNote(child)}
                        >
                          <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{child.title}</span>
                        </button>
                        <button
                          className="p-1 rounded opacity-0 group-hover/sub:opacity-100 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all shrink-0"
                          onClick={() => setConfirmDelete(child.id)}
                          title="Delete sub-page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Editor — seamless text area at the bottom */}
                <div className="notes-editor">
                  <RichTextEditor
                    key={currentNote.id}
                    value={currentNote.content}
                    onChange={handleContentChange}
                    placeholder="Type '/' for commands..."
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <StickyNote className="w-16 h-16 opacity-30" />
                </motion.div>
                <h2 className="text-xl font-semibold text-foreground">Select a note</h2>
                <p className="text-sm text-center max-w-sm">
                  Choose a note from the sidebar or create a new one to get started.
                </p>
                <Button onClick={() => handleCreate()} className="mt-2 btn-press">
                  <Plus className="w-4 h-4 mr-2" /> Create Note
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {confirmDelete && (
          <ConfirmModal
            title="Delete Note"
            message="Are you sure you want to delete this note? This action cannot be undone."
            confirmLabel="Delete Note"
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </div>
    </PageTransition>
  );
}
