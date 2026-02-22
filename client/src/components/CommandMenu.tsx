import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { useTheme } from './ThemeProvider';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { LayoutDashboard, User, Moon, Sun, Monitor, CheckCircle2, ClipboardList } from 'lucide-react';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { token } = useAuthStore();
  const { boards, currentBoard } = useBoardStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Only trigger if logged in
      if (!token) return;

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [token]);

  // Do not render if not logged in
  if (!token) return null;

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/profile'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Go to Profile</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme Settings">
          <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Theme</span>
            {theme === 'light' && <CheckCircle2 className="ml-auto flex h-4 w-4 text-primary" />}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Theme</span>
            {theme === 'dark' && <CheckCircle2 className="ml-auto flex h-4 w-4 text-primary" />}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System Theme</span>
            {theme === 'system' && <CheckCircle2 className="ml-auto flex h-4 w-4 text-primary" />}
          </CommandItem>
        </CommandGroup>

        {boards && boards.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Your Boards">
              {boards.map((board) => (
                <CommandItem
                  key={board.id}
                  onSelect={() => runCommand(() => navigate(`/board/${board.id}`))}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>{board.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {currentBoard && currentBoard.lists && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Tasks in ${currentBoard.title}`}>
              {currentBoard.lists.flatMap(list =>
                list.tasks.map(task => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => {
                      runCommand(() => {
                        // In a real app we might scroll to the task or open it,
                        // but opening a task requires triggering the TaskModal.
                        // For now we just navigate to the board (which handles it if we are already there).
                        navigate(`/board/${currentBoard.id}`);
                        // Optionally dispatch an event or use a ref to open the modal
                      });
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{list.title}</span>
                  </CommandItem>
                ))
              ).slice(0, 10)} {/* Limit to 10 tasks to avoid clutter */}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
