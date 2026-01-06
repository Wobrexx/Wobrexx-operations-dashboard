import { useState, useMemo } from 'react';
import { Plus, Target, DollarSign } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { useDashboard, Budget } from '@/contexts/DashboardContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const EXPENSE_CATEGORIES = [
  'Infrastructure',
  'Software',
  'Marketing',
  'Personnel',
  'Office',
  'Travel',
  'Other',
];

export function BudgetPlanningDialog() {
  const { budgets, setBudgets, expenses } = useDashboard();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  // Generate month options (current month + next 11 months)
  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = addMonths(now, i);
      months.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy')
      });
    }
    return months;
  }, []);

  // Get existing categories from expenses
  const existingCategories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    EXPENSE_CATEGORIES.forEach(c => cats.add(c));
    return Array.from(cats);
  }, [expenses]);

  const handleSubmit = () => {
    if (!category || !monthlyTarget) {
      toast({ 
        title: 'Missing fields', 
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(monthlyTarget);
    if (isNaN(amount) || amount <= 0) {
      toast({ 
        title: 'Invalid amount', 
        description: 'Please enter a valid positive amount.',
        variant: 'destructive'
      });
      return;
    }

    // Check if budget already exists for this category and month
    const existingIndex = budgets.findIndex(
      b => b.category === category && b.month === selectedMonth
    );

    if (existingIndex >= 0) {
      // Update existing budget
      const updated = [...budgets];
      updated[existingIndex] = { ...updated[existingIndex], monthlyTarget: amount };
      setBudgets(updated);
      toast({ 
        title: 'Budget updated', 
        description: `${category} budget for ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')} updated to $${amount.toLocaleString()}.`
      });
    } else {
      // Create new budget
      const newBudget: Budget = {
        id: Date.now().toString(),
        category,
        monthlyTarget: amount,
        month: selectedMonth,
      };
      setBudgets([...budgets, newBudget]);
      toast({ 
        title: 'Budget created', 
        description: `Budget target set for ${category} in ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}.`
      });
    }

    // Reset form
    setCategory('');
    setMonthlyTarget('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Target className="h-4 w-4" />
          Set Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Set Monthly Budget Target
          </DialogTitle>
          <DialogDescription>
            Define expense limits by category to track spending against targets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="budget-month">Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="budget-month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="budget-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {existingCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-target">Monthly Target ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthly-target"
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                placeholder="1000"
                className="pl-9"
                min="0"
                step="100"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Plus className="h-4 w-4" />
            Set Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
