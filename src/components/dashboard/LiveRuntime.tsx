import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveRuntimeProps {
  startDate: Date;
  status: string;
  className?: string;
}

export function LiveRuntime({ startDate, status, className }: LiveRuntimeProps) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calculateElapsed = () => {
      if (status !== 'Live' && status !== 'Active' && status !== 'Development') {
        setElapsed('--');
        return;
      }

      const now = new Date();
      const diff = now.getTime() - startDate.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setElapsed(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setElapsed(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setElapsed(`${minutes}m ${seconds}s`);
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startDate, status]);

  const isActive = status === 'Live' || status === 'Active' || status === 'Development';

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs font-mono',
      isActive ? 'text-success' : 'text-muted-foreground',
      className
    )}>
      <Clock className={cn('h-3 w-3', isActive && 'animate-pulse')} />
      <span>{elapsed}</span>
    </div>
  );
}
