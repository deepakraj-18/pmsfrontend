import React from 'react';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'cyan';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onHide,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const themes = {
    danger: { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'text-red-500', border: 'border-red-500', icon: <Trash2 size={44} className="text-white" /> },
    warning: { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-500', border: 'border-amber-500', icon: <AlertTriangle size={44} className="text-white" /> },
    info: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-500', border: 'border-blue-500', icon: <Info size={44} className="text-white" /> },
    cyan: { bg: 'bg-[#0cb1c9]', hover: 'hover:bg-[#0aa1b8]', text: 'text-[#0cb1c9]', border: 'border-[#0cb1c9]', icon: <span className="text-white text-[56px] font-medium leading-none pb-1">?</span> },
  };

  const theme = themes[variant];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      showHeader={false}
      style={{ width: '380px' }}
      pt={{
        root: { className: 'rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 !mt-12 !overflow-visible' },
        content: { className: 'p-0 !overflow-visible' },
        mask: { className: 'backdrop-blur-sm bg-black/40' }
      }}
    >
      <div className="relative pt-12 pb-8 px-6 text-center flex flex-col items-center w-full">
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-[90px] h-[90px] ${theme.bg} rounded-full flex items-center justify-center shadow-lg`}>
          {theme.icon}
        </div>
        <h3 className="text-[22px] font-bold text-[#4b5563] dark:text-white mb-3 mt-3">
          {title}
        </h3>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8">
          {message}
        </p>

        <div className="flex items-center justify-center gap-3 w-full">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${theme.bg} ${theme.hover} text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm text-[15px] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onHide}
            disabled={loading}
            className={`flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 ${theme.text} font-bold py-3 px-4 rounded-xl border-[2px] ${theme.border} transition-colors text-[15px] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export const showConfirmDelete = (onConfirm: () => void, message: string, title: string = 'Delete Confirmation') => {
  confirmDialog({
    showHeader: false,
    message: (
      <div className="relative pt-12 px-6 text-center flex flex-col items-center w-full">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[90px] h-[90px] bg-red-500 rounded-full flex items-center justify-center shadow-lg">
          <Trash2 size={44} className="text-white" />
        </div>
        <h3 className="text-[22px] font-bold text-[#4b5563] dark:text-white mb-3 mt-3">
          {title}
        </h3>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-2">
          {message}
        </p>
      </div>
    ),
    footer: (options: any) => (
      <div className="flex items-center justify-center gap-3 pb-8 px-6 w-full mt-2">
        <button
          onClick={() => { onConfirm(); options.accept(); }}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm text-[15px]"
        >
          Delete
        </button>
        <button
          onClick={options.reject}
          className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-red-500 font-bold py-3 px-4 rounded-xl border-[2px] border-red-500 transition-colors text-[15px]"
        >
          Cancel
        </button>
      </div>
    ),
    pt: {
      root: { className: 'rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-[380px] w-full !mt-12 !overflow-visible' },
      content: { className: 'p-0 !overflow-visible' },
      mask: { className: 'backdrop-blur-sm bg-black/40' }
    }
  });
};
