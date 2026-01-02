import { format } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDashboard } from '@/contexts/DashboardContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import wobrexxLogo from '@/assets/wobrexx-logo.png';

export function Header() {
  const { selectedDate, setSelectedDate, viewMode, setViewMode } = useDashboard();

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img src={wobrexxLogo} alt="Wobrexx" className="w-9 h-9 object-contain" />
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Wobrexx Operations Dashboard
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-border bg-background p-1">
          {(['monthly', 'quarterly', 'yearly'] as const).map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-3 text-xs font-medium capitalize transition-colors',
                viewMode === mode
                  ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              )}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </Button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 font-normal"
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {format(selectedDate, 'MMMM yyyy')}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <ThemeToggle />
      </div>
    </header>
  );
}
