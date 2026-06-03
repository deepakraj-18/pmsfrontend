import { Button } from 'primereact/button';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

export function useToast() {
    return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const { type, title, message } = (e as CustomEvent).detail;
            showToast(type as ToastType, title, message);
        };
        window.addEventListener('pms:toast', handler);
        return () => window.removeEventListener('pms:toast', handler);
    }, [showToast]);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <XCircle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            case 'info': return <Info className="w-5 h-5" />;
        }
    };

    const getStyles = (type: ToastType) => {
        switch (type) {
            case 'success': return { bg: '#f0fdfa', border: '#14b8a6', text: '#0f172a', icon: '#0d9488' };
            case 'error': return { bg: '#fef2f2', border: '#ef4444', text: '#0f172a', icon: '#dc2626' };
            case 'warning': return { bg: '#fffbeb', border: '#f59e0b', text: '#0f172a', icon: '#d97706' };
            case 'info': return { bg: '#f0f9ff', border: '#3b82f6', text: '#0f172a', icon: '#2563eb' };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => {
                    const styles = getStyles(toast.type);
                    return (
                        <div
                            key={toast.id}
                            className="pointer-events-auto toast-container"
                            style={{
                                backgroundColor: styles.bg,
                                borderColor: styles.border,
                                border: `1px solid ${styles.border}`,
                            }}
                        >
                            <div className="toast-icon" style={{ color: styles.icon }}>
                                {getIcon(toast.type)}
                            </div>
                            <div className="toast-body">
                                <p className="toast-title" style={{ color: styles.text }}>
                                    {toast.title}
                                </p>
                                {toast.message && (
                                    <p className="toast-message" style={{ color: styles.text }}>
                                        {toast.message}
                                    </p>
                                )}
                            </div>
                            <Button unstyled
                                onClick={() => removeToast(toast.id)}
                                className="toast-close"
                                style={{ color: styles.text }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
