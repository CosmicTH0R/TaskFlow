import { X, Keyboard } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Keyboard size={20} /> Keyboard Shortcuts</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="shortcuts-list">
          {shortcuts.map((s) => (
            <div key={s.key} className="shortcut-row">
              <kbd className="shortcut-key">{s.key}</kbd>
              <span>{s.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
