import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { subscribeToast, type ToastItem } from './toast';

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToast(t => {
      setItems(prev => [...prev, t]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 2600);
    });
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center gap-2.5 max-w-xs bg-superficie border border-[rgba(245,197,24,0.45)] text-tinta text-sm font-medium px-4 py-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          >
            <Info className="w-4 h-4 text-accent shrink-0" />
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
