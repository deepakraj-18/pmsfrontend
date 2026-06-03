import { Button } from '@/components/forms/Button';
import { Card } from '@/components/layout/Card';

interface FormCardProps {
  children: React.ReactNode;

  sectionTitle?: string;

  columns?: 2 | 3 | 4;

  footer?: {
    cancelLabel?: string;
    submitLabel?: string;
    submittingLabel?: string;
    onCancel: () => void;
    isSubmitting?: boolean;
    isDisabled?: boolean;
  };
  className?: string;
}

const COL_MAP: Record<number, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export function FormCard({ children, sectionTitle, columns = 3, footer, className = '' }: FormCardProps) {
  return (
    <div
      className={`rounded-2xl flex flex-col overflow-hidden ${className}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}
    >
      {sectionTitle && (
        <div className="px-6 py-4 border-b" style={{ borderBottomColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>{sectionTitle}</h3>
        </div>
      )}
      <div className="p-5 md:p-6">
        <div className={`grid ${COL_MAP[columns] || COL_MAP[3]} gap-x-6 gap-y-5`}>
          {children}
        </div>
      </div>

      {footer && (
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <Button variant="ghost" type="Button" onClick={footer.onCancel}>
            {footer.cancelLabel || 'Cancel'}
          </Button>
          <Button variant="gradient" type="submit" disabled={footer.isDisabled || footer.isSubmitting}>
            {footer.isSubmitting ? (footer.submittingLabel || 'Saving...') : (footer.submitLabel || 'Save Changes')}
          </Button>
        </div>
      )}
    </div>
  );
}
