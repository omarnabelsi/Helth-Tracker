import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-bg-card border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className={`w-12 h-12 rounded-2xl ${type === 'danger' ? 'bg-red-500/10' : 'bg-primary-accent/10'} flex items-center justify-center border ${type === 'danger' ? 'border-red-500/20' : 'border-primary-accent/20'}`}>
              <AlertTriangle className={type === 'danger' ? 'text-red-500' : 'text-primary-accent'} size={24} />
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-100/50 flex items-center justify-center text-text-muted hover:bg-gray-200 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <h3 className="text-xl font-bold text-text-primary mb-2 font-heading">{title}</h3>
          <p className="text-sm text-text-muted leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-text-primary bg-bg-main hover:bg-gray-100 transition-all border border-gray-200"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${
                type === 'danger' 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                  : 'bg-primary-accent hover:bg-primary-accent/90 shadow-primary-accent/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
