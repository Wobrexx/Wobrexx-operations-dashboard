import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        'h-9 w-9 rounded-lg border-border transition-all duration-300',
        'hover:bg-accent hover:text-accent-foreground'
      )}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Sun className={cn(
        'h-4 w-4 transition-all duration-300',
        theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
      )} />
      <Moon className={cn(
        'absolute h-4 w-4 transition-all duration-300',
        theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
