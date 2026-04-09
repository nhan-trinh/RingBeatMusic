import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md'
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      timer = setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      timer = setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen && !animate) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
      animate ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
    }`}>
      <div 
        className={`bg-[#282828] w-full ${sizeClasses[size]} rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
          animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3e3e3e]">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-[#b3b3b3] hover:text-white p-1 rounded-full hover:bg-[#3e3e3e] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {children}
        </div>

        {footer ? (
          <div className="px-6 py-4 bg-[#181818]/50 border-t border-[#3e3e3e] flex items-center justify-end gap-3">
            {footer}
          </div>
        ) : (
          <div className="px-6 pb-6 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="text-[#b3b3b3] hover:text-white">Cancel</Button>
            <Button onClick={onClose}>Okay</Button>
          </div>
        )}
      </div>
    </div>
  );
};
