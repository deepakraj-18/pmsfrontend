import { UseFormSetError } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

export function handleServerError(
    error: any,
    setError: UseFormSetError<any> | null | undefined,
    showToast: (type: 'success' | 'error' | 'info' | 'warn', title: string, message: string) => void,
    defaultTitle: string = 'Error',
    excludeToast: boolean = false
) {
    const detail = error?.response?.data?.detail;
    const status = error?.response?.status;
    const isGloballyHandled = status === 403 || (status !== undefined && status >= 500);

    let hasFieldErrors = false;

    if (Array.isArray(detail)) {
        detail.forEach((err: any) => {
            const pathParts = err.loc.filter((p: any) => p !== 'body');
            let field = pathParts.join('.') || pathParts[pathParts.length - 1];

            if (field === 'public_id' || field === 'id_sync' || field === 'project_id_sync') {
                if (setError) {
                    setError('project_id_sync', { type: 'manual', message: err.msg });
                    setError('task_name', { type: 'manual', message: `ID Conflict: ${err.msg}` });
                    setError('bug_name', { type: 'manual', message: `ID Conflict: ${err.msg}` });
                    hasFieldErrors = true;
                }
            }

            if (field && setError) {
                setError(field, { type: 'manual', message: err.msg });
                hasFieldErrors = true;
            }
        });
        if (!isGloballyHandled && !excludeToast) {
            showToast('error', defaultTitle, 'Please correct the highlighted fields.');
        }
    } else if (typeof detail === 'string') {
        const msg = detail.toLowerCase();
        if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('unique')) {
            if (msg.includes('project name') || msg.includes('project_name')) {
                setError?.('project_name', { type: 'manual', message: detail });
                hasFieldErrors = true;
            } else if (msg.includes('task name') || msg.includes('task_name')) {
                setError?.('task_name', { type: 'manual', message: detail });
                hasFieldErrors = true;
            } else if (msg.includes('bug name') || msg.includes('bug_name') || msg.includes('defect name')) {
                setError?.('bug_name', { type: 'manual', message: detail });
                hasFieldErrors = true;
            } else if (msg.includes('milestone name') || msg.includes('milestone_name')) {
                setError?.('milestone_name', { type: 'manual', message: detail });
                hasFieldErrors = true;
            } else if (msg.includes('sync id') || msg.includes('project_id_sync')) {
                setError?.('project_id_sync', { type: 'manual', message: detail });
                hasFieldErrors = true;
            } else if (msg.includes('public id') || msg.includes('public_id') || msg.includes('tt-') || msg.includes('st-')) {

                setError?.('root', { type: 'manual', message: detail });

                setError?.('task_name', { type: 'manual', message: `Identifier conflict: ${detail}` });
                setError?.('bug_name', { type: 'manual', message: `Identifier conflict: ${detail}` });
                hasFieldErrors = true;
            } else {
                setError?.('root', { type: 'manual', message: detail });
            }
        } else {
            setError?.('root', { type: 'manual', message: detail });
        }

        if (!isGloballyHandled && !excludeToast) {

            if (!hasFieldErrors) {
                showToast('error', defaultTitle, detail);
            } else {
                showToast('error', defaultTitle, 'Please correct the highlighted fields.');
            }
        }
    } else {
        const fallback = 'An unexpected error occurred. Please try again.';
        setError?.('root', { type: 'manual', message: fallback });
        if (!isGloballyHandled && !excludeToast) showToast('error', defaultTitle, fallback);
    }
}
