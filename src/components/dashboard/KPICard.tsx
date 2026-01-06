import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  format?: 'number' | 'currency' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
}

export function KPICard({
  title,
  value,
  format = 'number',
  trend = 'neutral',
  variant = 'default',
  icon,
}: KPICardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getVariantStyles = () => {
    const base = 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 cursor-default group';
    switch (variant) {
      case 'success':
        return `${base} border-l-4 border-l-success`;
      case 'warning':
        return `${base} border-l-4 border-l-warning`;
      case 'destructive':
        return `${base} border-l-4 border-l-destructive`;
      default:
        return `${base} border-l-4 border-l-primary`;
    }
  };

  return (
    <Card className={cn(getVariantStyles())}>
      <CardContent className="p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.02] group-hover:to-primary/[0.05] transition-all duration-300" />
        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {title}
            </p>
            <span className="text-2xl font-bold text-foreground">
              {formatValue(value)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {icon}
            <div className="p-1.5">{getTrendIcon()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
