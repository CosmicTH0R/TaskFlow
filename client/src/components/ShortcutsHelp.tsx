import { Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface ShortcutsHelpProps {
  onClose: () => void;
}

const shortcuts = [
  { key: 'N', description: 'Add a new task to the first list' },
  { key: '/', description: 'Focus the search / filter input' },
  { key: 'Esc', description: 'Close any open modal or sidebar' },
  { key: '?', description: 'Show / hide this help overlay' },
];

export default function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Keyboard className="w-5 h-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <kbd className="px-2 py-1 bg-muted border border-border rounded-md text-xs font-mono font-bold text-foreground min-w-[32px] text-center shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
