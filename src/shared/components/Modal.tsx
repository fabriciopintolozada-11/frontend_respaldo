import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
    '4xl': 'max-w-5xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F1115]/85 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className={`relative w-full ${maxStyles[maxWidth]} bg-[#16191F] rounded-2xl shadow-2xl border border-[#2D3139] text-[#E0E2E6] overflow-hidden z-10 my-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3139] bg-[#1C2028]/80">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-[#8E949F] mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8E949F] hover:text-white hover:bg-[#2D3139] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-thin">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
