import { cn } from '@/lib/utils';

type StatusType = 
  | 'Active' | 'Paused' | 'Opted Out'
  | 'Live' | 'Development' | 'Completed'
  | 'Healthy' | 'Warning' | 'Failed';

interface StatusBadgeProps {
  status: StatusType;
  onClick?: () => void;
}

const statusStyles: Record<StatusType, string> = {
  'Active': 'bg-success/10 text-success border-success/20',
  'Paused': 'bg-warning/10 text-warning border-warning/20',
  'Opted Out': 'bg-destructive/10 text-destructive border-destructive/20',
  'Live': 'bg-success/10 text-success border-success/20',
  'Development': 'bg-info/10 text-info border-info/20',
  'Completed': 'bg-muted text-muted-foreground border-border',
  'Healthy': 'bg-success/10 text-success border-success/20',
  'Warning': 'bg-warning/10 text-warning border-warning/20',
  'Failed': 'bg-destructive/10 text-destructive border-destructive/20',
};

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const Component = onClick ? 'button' : 'span';
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status] || 'bg-muted text-muted-foreground border-border',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        status === 'Active' || status === 'Live' || status === 'Healthy' ? 'bg-success' :
        status === 'Paused' || status === 'Warning' ? 'bg-warning' :
        status === 'Opted Out' || status === 'Failed' ? 'bg-destructive' :
        status === 'Development' ? 'bg-info' : 'bg-muted-foreground'
      )} />
      {status}
    </Component>
  );
}
