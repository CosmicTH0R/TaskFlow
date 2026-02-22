import { create } from 'zustand';
import { notesAPI } from '../services/api';
import { Note } from '../types';

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  notesLoading: boolean;
  searchQuery: string;

  fetchNotes: (search?: string, boardId?: string) => Promise<void>;
  createNote: (boardId?: string, parentId?: string) => Promise<Note | null>;
  updateNote: (id: string, data: { title?: string; content?: string; emoji?: string }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNote: null,
  notesLoading: false,
  searchQuery: '',

  fetchNotes: async (search?: string, boardId?: string) => {
    set({ notesLoading: true });
    try {
      const res = await notesAPI.list({ search, boardId });
      set({ notes: res.data.notes, notesLoading: false });
    } catch {
      set({ notesLoading: false });
    }
  },

  createNote: async (boardId?: string, parentId?: string) => {
    try {
      const res = await notesAPI.create({ title: 'Untitled', boardId, parentId });
      const note = res.data.note;
      set((state) => ({ notes: [note, ...state.notes], currentNote: note }));
      return note;
    } catch {
      return null;
    }
  },

  updateNote: async (id, data) => {
    try {
      const res = await notesAPI.update(id, data);
      const updated = res.data.note;
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
        currentNote: state.currentNote?.id === id ? updated : state.currentNote,
      }));
    } catch {
      // silent fail for auto-save
    }
  },

  deleteNote: async (id) => {
    try {
      await notesAPI.delete(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }));
    } catch {
      // handle error
    }
  },

  setCurrentNote: (note) => set({ currentNote: note }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
