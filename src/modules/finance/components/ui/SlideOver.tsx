import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl';
}

export function SlideOver({ isOpen, onClose, title, children, footer, width = 'md' }: SlideOverProps) {
  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-500/75 transition-opacity backdrop-blur-sm" 
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className={clsx("w-screen", widthClasses[width])}>
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="py-6 px-4 bg-gradient-to-r from-primary-600 to-primary-800 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white" id="slide-over-title">
                    {title}
                  </h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      type="button"
                      className="bg-transparent rounded-md text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative flex-1 p-6 space-y-5">
                {children}
              </div>
              {footer && (
                <div className="flex-shrink-0 px-4 py-4 flex justify-end gap-2 border-t border-slate-200 bg-slate-50">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
