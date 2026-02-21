import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onNewTask?: () => void;
  onCloseModal?: () => void;
  onFocusSearch?: () => void;
  onToggleHelp?: () => void;
}

export function useKeyboardShortcuts({
  onNewTask,
  onCloseModal,
  onFocusSearch,
  onToggleHelp,
}: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          onCloseModal?.();
        }
        return;
      }

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          onNewTask?.();
          break;
        case 'Escape':
          onCloseModal?.();
          break;
        case '/':
          e.preventDefault();
          onFocusSearch?.();
          break;
        case '?':
          e.preventDefault();
          onToggleHelp?.();
          break;
      }
    },
    [onNewTask, onCloseModal, onFocusSearch, onToggleHelp]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
