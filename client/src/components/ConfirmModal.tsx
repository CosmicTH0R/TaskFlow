import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {danger && (
              <motion.div
                className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </motion.div>
              </motion.div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <DialogDescription className="pt-2 text-base text-foreground/80">{message}</DialogDescription>
          </motion.div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button type="button" variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="button"
              variant={danger ? 'destructive' : 'default'}
              onClick={onConfirm}
              id="confirm-action-btn"
              className="btn-press"
            >
              {confirmLabel}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
