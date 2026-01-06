import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, TrendingUp, DollarSign, Wallet, BarChart3, Filter, Calendar, CheckCircle, XCircle, Download, FileText, AlertCircle, Bell, History, Clock, Receipt, Target, TrendingDown, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ReferenceLine, Legend } from 'recharts';
import { format, isBefore, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { useDashboard, Expense, Customer, PaymentInfo, PaymentHistory, Budget } from '@/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditableCell } from '@/components/dashboard/EditableCell';
import { KPICard } from '@/components/dashboard/KPICard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToPDF, FinancialExportData } from '@/utils/exportFinancials';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { AddPaymentDialog } from '@/components/dashboard/AddPaymentDialog';
import { AddExpenseDialog } from '@/components/dashboard/AddExpenseDialog';
import { BudgetPlanningDialog } from '@/components/dashboard/BudgetPlanningDialog';
import { CustomerDetailDialog } from '@/components/dashboard/CustomerDetailDialog';
import { Progress } from '@/components/ui/progress';
const EXPENSE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const SERVICE_COLORS = {
  Website: 'hsl(var(--chart-1))',
  Software: 'hsl(var(--chart-2))',
  Automation: 'hsl(var(--chart-3))',
};

const PAYMENT_TYPE_COLORS = {
  project: 'hsl(var(--chart-1))',
  maintenance: 'hsl(var(--chart-2))',
  newRequirement: 'hsl(var(--chart-3))',
};

const paymentTypeOptions = [
  { value: 'all', label: 'All Payment Types' },
  { value: 'project', label: 'Project Payment' },
  { value: 'maintenance', label: 'Maintenance Payment' },
  { value: 'newRequirement', label: 'New Requirement' },
];

const maintenanceFilterOptions = [
  { value: 'all', label: 'All Customers' },
  { value: 'paid', label: 'Paid This Month' },
  { value: 'unpaid', label: 'Not Paid This Month' },
];

const timePeriodOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

// Section Header Component
function SectionHeader({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string; 
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 pb-2">
      {Icon && (
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function Financials() {
  const { expenses, setExpenses, financialKPIs, chartData, customers, setCustomers, paymentHistory, addPaymentRecord, viewMode, setViewMode, budgets, setBudgets } = useDashboard();
  const { toast } = useToast();
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [maintenanceFilter, setMaintenanceFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState('payments');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [customerToView, setCustomerToView] = useState<Customer | null>(null);

  const handleViewClick = (customer: Customer) => {
    setCustomerToView(customer);
    setViewDialogOpen(true);
  };

  // Get date range based on global view mode
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (viewMode) {
      case 'monthly':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarterly':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'yearly':
        return { start: startOfYear(now), end: endOfYear(now) };
    }
  }, [viewMode]);

  // Filter payment history based on time period
  const filteredPaymentHistory = useMemo(() => {
    return paymentHistory.filter(payment => {
      const paymentDate = parseISO(payment.date);
      return isWithinInterval(paymentDate, dateRange);
    });
  }, [paymentHistory, dateRange]);

  // Calculate period-based totals
  const periodTotals = useMemo(() => {
    const periodPayments = filteredPaymentHistory;
    
    return {
      totalRevenue: periodPayments.reduce((sum, p) => sum + p.amount, 0),
      projectRevenue: periodPayments.filter(p => p.paymentType === 'project').reduce((sum, p) => sum + p.amount, 0),
      maintenanceRevenue: periodPayments.filter(p => p.paymentType === 'maintenance').reduce((sum, p) => sum + p.amount, 0),
      newRequirementRevenue: periodPayments.filter(p => p.paymentType === 'newRequirement').reduce((sum, p) => sum + p.amount, 0),
      transactionCount: periodPayments.length,
    };
  }, [filteredPaymentHistory]);

  const updateExpense = (id: string, field: keyof Expense, value: string | number | boolean) => {
    setExpenses(
      expenses.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      )
    );
  };

  // Remove the inline addExpense - we'll use the dialog instead

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // Update customer financial fields
  const updateCustomerPayment = useCallback((
    customerId: string, 
    paymentType: 'projectPayment' | 'maintenancePayment' | 'newRequirementPayment',
    field: keyof PaymentInfo,
    value: number
  ) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const oldValue = customer[paymentType][field as keyof PaymentInfo];
    
    setCustomers(customers.map(c => {
      if (c.id !== customerId) return c;
      return {
        ...c,
        [paymentType]: { ...c[paymentType], [field]: value }
      };
    }));

    // Log payment if amountPaid increased
    if (field === 'amountPaid' && value > oldValue) {
      const paymentTypeMap = {
        projectPayment: 'project' as const,
        maintenancePayment: 'maintenance' as const,
        newRequirementPayment: 'newRequirement' as const,
      };
      addPaymentRecord({
        customerId,
        customerName: customer.companyName,
        paymentType: paymentTypeMap[paymentType],
        amount: value - oldValue,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: `Payment updated via inline edit`,
      });
    }
  }, [customers, setCustomers, addPaymentRecord]);

  // Toggle maintenance paid status for a customer
  const toggleMaintenancePaid = useCallback((customerId: string, month: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const paidMonths = customer.maintenancePaidMonths || [];
    const isPaid = paidMonths.includes(month);
    
    setCustomers(customers.map(c => {
      if (c.id !== customerId) return c;
      return {
        ...c,
        maintenancePaidMonths: isPaid 
          ? paidMonths.filter(m => m !== month)
          : [...paidMonths, month]
      };
    }));

    // Log payment if marking as paid
    if (!isPaid) {
      addPaymentRecord({
        customerId,
        customerName: customer.companyName,
        paymentType: 'maintenance',
        amount: customer.maintenancePayment.estimatedCost,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: `Maintenance payment for ${format(parseISO(month + '-01'), 'MMMM yyyy')}`,
      });
    }
  }, [customers, setCustomers, addPaymentRecord]);

  // Filter customers for financial view
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(c => c.status === 'Active');
    
    if (maintenanceFilter === 'paid') {
      filtered = filtered.filter(c => c.maintenance && c.maintenancePaidMonths?.includes(selectedMonth));
    } else if (maintenanceFilter === 'unpaid') {
      filtered = filtered.filter(c => c.maintenance && !c.maintenancePaidMonths?.includes(selectedMonth));
    }
    
    return filtered;
  }, [customers, maintenanceFilter, selectedMonth]);

  // Get customers needing payment reminders
  const customersNeedingReminders = useMemo(() => {
    const today = new Date();
    return customers.filter(c => {
      if (c.status !== 'Active' || !c.maintenance) return false;
      
      const currentMonth = format(today, 'yyyy-MM');
      const notPaidThisMonth = !c.maintenancePaidMonths?.includes(currentMonth);
      const isDuePassed = c.maintenanceDueDate && isBefore(parseISO(c.maintenanceDueDate), today);
      
      return notPaidThisMonth || isDuePassed;
    });
  }, [customers]);

  // Calculate totals
  const financialTotals = useMemo(() => {
    const activeCustomers = customers.filter(c => c.status === 'Active');
    return {
      totalProjectEstimated: activeCustomers.reduce((sum, c) => sum + c.projectPayment.estimatedCost, 0),
      totalProjectPaid: activeCustomers.reduce((sum, c) => sum + c.projectPayment.amountPaid, 0),
      totalMaintenanceEstimated: activeCustomers.reduce((sum, c) => sum + c.maintenancePayment.estimatedCost, 0),
      totalMaintenancePaid: activeCustomers.reduce((sum, c) => sum + c.maintenancePayment.amountPaid, 0),
      totalNewReqEstimated: activeCustomers.reduce((sum, c) => sum + c.newRequirementPayment.estimatedCost, 0),
      totalNewReqPaid: activeCustomers.reduce((sum, c) => sum + c.newRequirementPayment.amountPaid, 0),
    };
  }, [customers]);

  const totalEstimated = financialTotals.totalProjectEstimated + financialTotals.totalMaintenanceEstimated + financialTotals.totalNewReqEstimated;
  const totalPaid = financialTotals.totalProjectPaid + financialTotals.totalMaintenancePaid + financialTotals.totalNewReqPaid;
  const totalRemaining = totalEstimated - totalPaid;

  // Calculate period-based expenses
  const periodExpenses = useMemo(() => {
    const multiplier = viewMode === 'monthly' ? 1 : viewMode === 'quarterly' ? 3 : 12;
    return expenses.reduce((sum, e) => sum + (e.recurring ? e.amount * multiplier : e.amount), 0);
  }, [expenses, viewMode]);

  // Export functions
  const handleExport = (type: 'csv' | 'pdf') => {
    const exportData: FinancialExportData = {
      customers: customers.filter(c => c.status === 'Active'),
      totals: financialTotals
    };
    
    if (type === 'csv') {
      exportToCSV(exportData);
      toast({ title: 'CSV exported', description: 'Financial report downloaded successfully.' });
    } else {
      exportToPDF(exportData);
      toast({ title: 'PDF exported', description: 'Financial report downloaded successfully.' });
    }
  };

  // Group expenses by category for pie chart
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const existing = acc.find((e) => e.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Revenue by service type
  const revenueByService = chartData.serviceDistribution.map((s) => ({
    name: s.name,
    value: Math.round((s.value / 100) * financialKPIs.mrr),
  }));

  // Profit trend data
  const profitTrendData = chartData.revenueExpenses.map((item) => ({
    month: item.month,
    profit: item.revenue - item.expenses,
  }));

  // Payment history by type for chart
  const paymentsByType = useMemo(() => {
    return [
      { name: 'Project', value: periodTotals.projectRevenue, color: PAYMENT_TYPE_COLORS.project },
      { name: 'Maintenance', value: periodTotals.maintenanceRevenue, color: PAYMENT_TYPE_COLORS.maintenance },
      { name: 'New Req.', value: periodTotals.newRequirementRevenue, color: PAYMENT_TYPE_COLORS.newRequirement },
    ];
  }, [periodTotals]);

  // Budget variance calculations
  const budgetVarianceData = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const monthBudgets = budgets.filter(b => b.month === currentMonth);
    
    return monthBudgets.map(budget => {
      const actualSpending = expenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const variance = budget.monthlyTarget - actualSpending;
      const variancePercent = budget.monthlyTarget > 0 
        ? ((variance / budget.monthlyTarget) * 100)
        : 0;
      const usagePercent = budget.monthlyTarget > 0
        ? Math.min(100, (actualSpending / budget.monthlyTarget) * 100)
        : 100;
      
      return {
        category: budget.category,
        budget: budget.monthlyTarget,
        actual: actualSpending,
        variance,
        variancePercent,
        usagePercent,
        status: variance >= 0 ? 'under' : 'over' as 'under' | 'over',
      };
    });
  }, [budgets, expenses]);

  // Total budget summary
  const budgetSummary = useMemo(() => {
    const totalBudget = budgetVarianceData.reduce((sum, b) => sum + b.budget, 0);
    const totalActual = budgetVarianceData.reduce((sum, b) => sum + b.actual, 0);
    const totalVariance = totalBudget - totalActual;
    const overBudgetCategories = budgetVarianceData.filter(b => b.status === 'over').length;
    
    return {
      totalBudget,
      totalActual,
      totalVariance,
      overBudgetCategories,
      utilizationPercent: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
    };
  }, [budgetVarianceData]);

  const getRemainingBalance = (estimated: number, paid: number) => Math.max(0, estimated - paid);

  const getPaymentProgress = (estimated: number, paid: number) => {
    if (estimated === 0) return 100;
    return Math.min(100, Math.round((paid / estimated) * 100));
  };

  // Calculate total payment progress for a customer
  const getTotalCustomerProgress = (customer: Customer) => {
    const totalEstimated = customer.projectPayment.estimatedCost + 
      customer.maintenancePayment.estimatedCost + 
      customer.newRequirementPayment.estimatedCost;
    const totalPaid = customer.projectPayment.amountPaid + 
      customer.maintenancePayment.amountPaid + 
      customer.newRequirementPayment.amountPaid;
    return getPaymentProgress(totalEstimated, totalPaid);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  const getPaymentTypeBadge = (type: PaymentHistory['paymentType']) => {
    const variants = {
      project: 'default',
      maintenance: 'secondary',
      newRequirement: 'outline',
    } as const;
    const labels = {
      project: 'Project',
      maintenance: 'Maintenance',
      newRequirement: 'New Requirement',
    };
    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  // Generate month options for filter
  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy')
      });
    }
    return months;
  }, []);

  const getPeriodLabel = () => {
    switch (viewMode) {
      case 'monthly': return format(dateRange.start, 'MMMM yyyy');
      case 'quarterly': return `Q${Math.ceil((dateRange.start.getMonth() + 1) / 3)} ${format(dateRange.start, 'yyyy')}`;
      case 'yearly': return format(dateRange.start, 'yyyy');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Financials</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track revenue, expenses, and customer payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Period Selector - synced with header */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            {timePeriodOptions.map(opt => (
              <Button
                key={opt.value}
                variant={viewMode === opt.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(opt.value as typeof viewMode)}
                className="h-8"
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-8" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddPaymentDialog />
          <AddExpenseDialog />
          <BudgetPlanningDialog />
        </div>
      </div>

      {/* Section: Period Overview */}
      <section className="space-y-4">
        <SectionHeader 
          title={`${getPeriodLabel()} Overview`}
          description={`Financial summary for the selected ${viewMode} period`}
          icon={Calendar}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title={`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Revenue`}
            value={periodTotals.totalRevenue}
            format="currency"
            variant="success"
            icon={<DollarSign className="h-5 w-5 text-success" />}
          />
          <KPICard
            title="Project Revenue"
            value={periodTotals.projectRevenue}
            format="currency"
            variant="default"
            icon={<Receipt className="h-5 w-5 text-primary" />}
          />
          <KPICard
            title="Maintenance Revenue"
            value={periodTotals.maintenanceRevenue}
            format="currency"
            variant="default"
            icon={<Clock className="h-5 w-5 text-primary" />}
          />
          <KPICard
            title={`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Expenses`}
            value={periodExpenses}
            format="currency"
            variant="warning"
            icon={<Wallet className="h-5 w-5 text-warning" />}
          />
          <KPICard
            title="Net Profit"
            value={periodTotals.totalRevenue - periodExpenses}
            format="currency"
            variant={periodTotals.totalRevenue - periodExpenses > 0 ? 'success' : 'warning'}
            icon={<TrendingUp className="h-5 w-5 text-success" />}
          />
        </div>
      </section>

      {/* Section: Overall Totals */}
      <section className="space-y-4">
        <SectionHeader 
          title="Overall Financial Status"
          description="Cumulative totals across all time periods"
          icon={BarChart3}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Estimated"
            value={totalEstimated}
            format="currency"
            variant="default"
            icon={<DollarSign className="h-5 w-5 text-primary" />}
          />
          <KPICard
            title="Total Paid"
            value={totalPaid}
            format="currency"
            variant="success"
            icon={<Wallet className="h-5 w-5 text-success" />}
          />
          <KPICard
            title="Remaining Balance"
            value={totalRemaining}
            format="currency"
            variant={totalRemaining > 0 ? 'warning' : 'success'}
            icon={<BarChart3 className="h-5 w-5 text-warning" />}
          />
          <KPICard
            title="Collection Rate"
            value={totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 0}
            format="percentage"
            variant="default"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
        </div>
      </section>

      {/* Section: Payment Reminders */}
      {customersNeedingReminders.length > 0 && (
        <section className="space-y-4">
          <SectionHeader 
            title="Payment Reminders"
            description={`${customersNeedingReminders.length} customers need follow-up`}
            icon={Bell}
          />
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <div className="space-y-2">
                {customersNeedingReminders.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <div>
                        <span className="font-medium">{c.companyName}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          Due: {formatDate(c.maintenanceDueDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        ${c.maintenancePayment.estimatedCost.toLocaleString()}/month
                      </span>
                      <Badge variant="outline" className="text-warning border-warning">
                        Unpaid
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="payments">Customer Payments</TabsTrigger>
          <TabsTrigger value="payment-history">Payment History</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="budget">Budget Planning</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        {/* Customer Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {/* Section: Payment Summary */}
          <section className="space-y-4">
            <SectionHeader 
              title="Payment Summary by Type"
              description="Overview of estimated vs paid amounts"
              icon={Receipt}
            />
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={maintenanceFilter} onValueChange={setMaintenanceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceFilterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={cn(paymentTypeFilter === 'all' || paymentTypeFilter === 'project' ? '' : 'opacity-50')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Project Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Estimated:</span>
                      <span className="font-medium">${financialTotals.totalProjectEstimated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paid:</span>
                      <span className="font-medium text-success">${financialTotals.totalProjectPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t">
                      <span>Remaining:</span>
                      <span className={cn("font-medium", getRemainingBalance(financialTotals.totalProjectEstimated, financialTotals.totalProjectPaid) > 0 ? "text-warning" : "text-success")}>
                        ${getRemainingBalance(financialTotals.totalProjectEstimated, financialTotals.totalProjectPaid).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(paymentTypeFilter === 'all' || paymentTypeFilter === 'maintenance' ? '' : 'opacity-50')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Estimated:</span>
                      <span className="font-medium">${financialTotals.totalMaintenanceEstimated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paid:</span>
                      <span className="font-medium text-success">${financialTotals.totalMaintenancePaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t">
                      <span>Remaining:</span>
                      <span className={cn("font-medium", getRemainingBalance(financialTotals.totalMaintenanceEstimated, financialTotals.totalMaintenancePaid) > 0 ? "text-warning" : "text-success")}>
                        ${getRemainingBalance(financialTotals.totalMaintenanceEstimated, financialTotals.totalMaintenancePaid).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(paymentTypeFilter === 'all' || paymentTypeFilter === 'newRequirement' ? '' : 'opacity-50')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">New Requirement Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Estimated:</span>
                      <span className="font-medium">${financialTotals.totalNewReqEstimated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paid:</span>
                      <span className="font-medium text-success">${financialTotals.totalNewReqPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t">
                      <span>Remaining:</span>
                      <span className={cn("font-medium", getRemainingBalance(financialTotals.totalNewReqEstimated, financialTotals.totalNewReqPaid) > 0 ? "text-warning" : "text-success")}>
                        ${getRemainingBalance(financialTotals.totalNewReqEstimated, financialTotals.totalNewReqPaid).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section: Customer Financial Details */}
          <section className="space-y-4">
            <SectionHeader 
              title="Customer Financial Details"
              description={`${filteredCustomers.length} customers • Click values to edit`}
              icon={DollarSign}
            />
            <Card>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="w-[140px]">Progress</TableHead>
                        {(paymentTypeFilter === 'all' || paymentTypeFilter === 'project') && (
                          <>
                            <TableHead className="text-right">Proj. Est.</TableHead>
                            <TableHead className="text-right">Proj. Paid</TableHead>
                            <TableHead className="text-right">Proj. Rem.</TableHead>
                          </>
                        )}
                        {(paymentTypeFilter === 'all' || paymentTypeFilter === 'maintenance') && (
                          <>
                            <TableHead className="text-right">Maint. Est.</TableHead>
                            <TableHead className="text-right">Maint. Paid</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead className="text-center">{format(new Date(selectedMonth + '-01'), 'MMM')}</TableHead>
                          </>
                        )}
                        {(paymentTypeFilter === 'all' || paymentTypeFilter === 'newRequirement') && (
                          <>
                            <TableHead className="text-right">New Req. Est.</TableHead>
                            <TableHead className="text-right">New Req. Paid</TableHead>
                            <TableHead className="text-right">New Req. Rem.</TableHead>
                          </>
                        )}
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                            No customers match your filter criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => {
                          const isPaidThisMonth = customer.maintenancePaidMonths?.includes(selectedMonth);
                          const progress = getTotalCustomerProgress(customer);
                          return (
                            <TableRow key={customer.id}>
                              <TableCell className="font-medium">{customer.companyName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{customer.serviceType}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={progress} 
                                    className={cn(
                                      "h-2 flex-1",
                                      progress === 100 ? "[&>div]:bg-success" : progress >= 50 ? "[&>div]:bg-primary" : "[&>div]:bg-warning"
                                    )}
                                  />
                                  <span className={cn(
                                    "text-xs font-medium min-w-[36px] text-right",
                                    progress === 100 ? "text-success" : progress >= 50 ? "text-primary" : "text-warning"
                                  )}>
                                    {progress}%
                                  </span>
                                </div>
                              </TableCell>
                              {(paymentTypeFilter === 'all' || paymentTypeFilter === 'project') && (
                                <>
                                  <TableCell className="text-right">
                                    <InlineNumberEdit
                                      value={customer.projectPayment.estimatedCost}
                                      onChange={(v) => updateCustomerPayment(customer.id, 'projectPayment', 'estimatedCost', v)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <InlineNumberEdit
                                      value={customer.projectPayment.amountPaid}
                                      onChange={(v) => updateCustomerPayment(customer.id, 'projectPayment', 'amountPaid', v)}
                                      className="text-success"
                                    />
                                  </TableCell>
                                  <TableCell className={cn("text-right font-medium", getRemainingBalance(customer.projectPayment.estimatedCost, customer.projectPayment.amountPaid) > 0 ? "text-warning" : "text-success")}>
                                    ${getRemainingBalance(customer.projectPayment.estimatedCost, customer.projectPayment.amountPaid).toLocaleString()}
                                  </TableCell>
                                </>
                              )}
                              {(paymentTypeFilter === 'all' || paymentTypeFilter === 'maintenance') && (
                                <>
                                  <TableCell className="text-right">
                                    <InlineNumberEdit
                                      value={customer.maintenancePayment.estimatedCost}
                                      onChange={(v) => updateCustomerPayment(customer.id, 'maintenancePayment', 'estimatedCost', v)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <InlineNumberEdit
                                      value={customer.maintenancePayment.amountPaid}
                                      onChange={(v) => updateCustomerPayment(customer.id, 'maintenancePayment', 'amountPaid', v)}
                                      className="text-success"
                                    />
                                  </TableCell>
                                  <TableCell className="text-sm">{formatDate(customer.maintenanceDueDate)}</TableCell>
                                  <TableCell className="text-center">
                                    {customer.maintenance ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleMaintenancePaid(customer.id, selectedMonth)}
                                        className={cn(
                                          "h-8 w-8 p-0",
                                          isPaidThisMonth ? "text-success hover:text-success/80" : "text-destructive hover:text-destructive/80"
                                        )}
                                      >
                                        {isPaidThisMonth ? (
                                          <CheckCircle className="h-5 w-5" />
                                        ) : (
                                          <XCircle className="h-5 w-5" />
                                        )}
                                      </Button>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">N/A</span>
                                    )}
                                  </TableCell>
                                </>
                              )}
                              {(paymentTypeFilter === 'all' || paymentTypeFilter === 'newRequirement') && (
                                <>
                                  <TableCell className="text-right">
                                    <InlineNumberEdit
                                      value={customer.newRequirementPayment.estimatedCost}
                                      onChange={(v) => updateCustomerPayment(customer.id, 'newRequirementPayment', 'estimatedCost', v)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <InlineNumberEdit
                                      value={customer.newRequirementPayment.amountPaid}
                                      onChange={(v) => updateCustomerPayment(customer.id, 'newRequirementPayment', 'amountPaid', v)}
                                      className="text-success"
                                    />
                                  </TableCell>
                                  <TableCell className={cn("text-right font-medium", getRemainingBalance(customer.newRequirementPayment.estimatedCost, customer.newRequirementPayment.amountPaid) > 0 ? "text-warning" : "text-success")}>
                                    ${getRemainingBalance(customer.newRequirementPayment.estimatedCost, customer.newRequirementPayment.amountPaid).toLocaleString()}
                                  </TableCell>
                                </>
                              )}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handleViewClick(customer)}
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payment-history" className="space-y-6">
          <section className="space-y-4">
            <SectionHeader 
              title="Payment Transaction History"
              description={`${filteredPaymentHistory.length} transactions in ${getPeriodLabel()}`}
              icon={History}
            />
            
            {/* Payment History Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{periodTotals.transactionCount}</p>
                </CardContent>
              </Card>
              {paymentsByType.map(item => (
                <Card key={item.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{item.name} Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${item.value.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment History Table */}
            <Card>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaymentHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No payment records found for this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPaymentHistory.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-sm">{formatDate(payment.date)}</TableCell>
                            <TableCell className="font-medium">{payment.customerName}</TableCell>
                            <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                            <TableCell className="text-right font-medium text-success">
                              ${payment.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {payment.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <section className="space-y-4">
            <SectionHeader 
              title="Expense Tracking"
              description="Manage recurring and one-time expenses"
              icon={Wallet}
            />
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-[250px]">Description</TableHead>
                      <TableHead className="text-right">Amount ($)</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Recurring</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          <EditableCell
                            value={expense.category}
                            onChange={(v) => updateExpense(expense.id, 'category', v)}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={expense.description}
                            onChange={(v) => updateExpense(expense.id, 'description', v)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <EditableCell
                            value={expense.amount}
                            type="currency"
                            onChange={(v) => updateExpense(expense.id, 'amount', v)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {expense.dueDate ? formatDate(expense.dueDate) : '-'}
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={expense.recurring}
                            type="boolean"
                            onChange={(v) => updateExpense(expense.id, 'recurring', v)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateExpense(expense.id, 'isPaid', !expense.isPaid)}
                            className={cn(
                              "h-7 px-2 gap-1",
                              expense.isPaid 
                                ? "text-success hover:text-success/80" 
                                : "text-warning hover:text-warning/80"
                            )}
                          >
                            {expense.isPaid ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Paid
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                Unpaid
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Budget Planning Tab */}
        <TabsContent value="budget" className="space-y-6">
          {/* Budget Overview Section */}
          <section className="space-y-4">
            <SectionHeader 
              title="Budget Overview"
              description={`Monthly expense targets for ${format(new Date(), 'MMMM yyyy')}`}
              icon={Target}
            />
            
            {/* Budget Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard
                title="Total Budget"
                value={budgetSummary.totalBudget}
                format="currency"
                variant="default"
                icon={<Target className="h-5 w-5 text-primary" />}
              />
              <KPICard
                title="Total Spent"
                value={budgetSummary.totalActual}
                format="currency"
                variant={budgetSummary.totalVariance >= 0 ? 'success' : 'warning'}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <KPICard
                title="Remaining Budget"
                value={Math.abs(budgetSummary.totalVariance)}
                format="currency"
                variant={budgetSummary.totalVariance >= 0 ? 'success' : 'warning'}
                icon={budgetSummary.totalVariance >= 0 ? <TrendingDown className="h-5 w-5 text-success" /> : <TrendingUp className="h-5 w-5 text-warning" />}
              />
              <KPICard
                title="Budget Utilization"
                value={budgetSummary.utilizationPercent}
                format="percentage"
                variant={budgetSummary.utilizationPercent <= 100 ? 'default' : 'warning'}
                icon={<BarChart3 className="h-5 w-5 text-primary" />}
              />
            </div>
          </section>

          {/* Budget vs Actual Chart */}
          <section className="space-y-4">
            <SectionHeader 
              title="Budget vs Actual Spending"
              description="Visual comparison of targets and actual expenses by category"
              icon={BarChart3}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart Comparison */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Category Comparison</CardTitle>
                  <CardDescription>Budget targets vs actual spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetVarianceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'budget' ? 'Budget' : 'Actual']}
                        />
                        <Bar dataKey="budget" fill="hsl(var(--muted-foreground))" name="budget" radius={[0, 4, 4, 0]} opacity={0.5} />
                        <Bar dataKey="actual" fill="hsl(var(--primary))" name="actual" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-muted-foreground opacity-50" />
                      <span className="text-sm text-muted-foreground">Budget</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-primary" />
                      <span className="text-sm text-muted-foreground">Actual</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Variance Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Budget Variance</CardTitle>
                  <CardDescription>Under/over budget by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetVarianceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
                        <ReferenceLine x={0} stroke="hsl(var(--border))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [
                            `$${Math.abs(value).toLocaleString()} ${value >= 0 ? 'under' : 'over'} budget`,
                            'Variance'
                          ]}
                        />
                        <Bar 
                          dataKey="variance" 
                          radius={[0, 4, 4, 0]}
                        >
                          {budgetVarianceData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.variance >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-success" />
                      <span className="text-sm text-muted-foreground">Under Budget</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-destructive" />
                      <span className="text-sm text-muted-foreground">Over Budget</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Budget Tracking Table */}
          <section className="space-y-4">
            <SectionHeader 
              title="Detailed Budget Tracking"
              description="Category-wise budget utilization and variance"
              icon={Wallet}
            />
            
            <Card>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetVarianceData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No budgets set for this month. Click "Set Budget" to add one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        budgetVarianceData.map((item) => (
                          <TableRow key={item.category}>
                            <TableCell className="font-medium">{item.category}</TableCell>
                            <TableCell className="text-right">${item.budget.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${item.actual.toLocaleString()}</TableCell>
                            <TableCell className={cn(
                              "text-right font-medium",
                              item.variance >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {item.variance >= 0 ? '+' : '-'}${Math.abs(item.variance).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <Progress 
                                  value={item.usagePercent} 
                                  className={cn(
                                    "h-2 flex-1",
                                    item.usagePercent > 100 ? "[&>div]:bg-destructive" : 
                                    item.usagePercent > 80 ? "[&>div]:bg-warning" : "[&>div]:bg-success"
                                  )}
                                />
                                <span className={cn(
                                  "text-xs font-medium min-w-[40px] text-right",
                                  item.usagePercent > 100 ? "text-destructive" : 
                                  item.usagePercent > 80 ? "text-warning" : "text-success"
                                )}>
                                  {item.usagePercent.toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'under' ? 'default' : 'destructive'}
                                className={item.status === 'under' ? 'bg-success/10 text-success border-success/20' : ''}
                              >
                                {item.status === 'under' ? 'Under Budget' : 'Over Budget'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const currentMonth = format(new Date(), 'yyyy-MM');
                                  setBudgets(budgets.filter(b => !(b.category === item.category && b.month === currentMonth)));
                                  toast({ title: 'Budget removed', description: `${item.category} budget has been removed.` });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          {/* Revenue Growth Comparison Section */}
          <section className="space-y-4">
            <SectionHeader 
              title="Revenue Growth Comparison"
              description={`Compare revenue trends across ${viewMode} periods`}
              icon={TrendingUp}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expenses Comparison */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Revenue vs Expenses Trend</CardTitle>
                  <CardDescription>Historical comparison over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.revenueExpenses}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Expenses']}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--success))" name="revenue" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" fill="hsl(var(--warning))" name="expenses" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-success" />
                      <span className="text-sm text-muted-foreground">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-warning" />
                      <span className="text-sm text-muted-foreground">Expenses</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Month-over-Month Growth */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Growth Rate Analysis</CardTitle>
                  <CardDescription>Month-over-month revenue growth percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.revenueExpenses.map((item, index, arr) => ({
                        month: item.month,
                        growthRate: index === 0 ? 0 : Math.round(((item.revenue - arr[index - 1].revenue) / arr[index - 1].revenue) * 100),
                        profit: item.revenue - item.expenses
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 11 }} 
                          stroke="hsl(var(--muted-foreground))" 
                          tickFormatter={(v) => `${v}%`} 
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11 }} 
                          stroke="hsl(var(--muted-foreground))" 
                          tickFormatter={(v) => `$${v}`} 
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [
                            name === 'growthRate' ? `${value}%` : `$${value.toLocaleString()}`, 
                            name === 'growthRate' ? 'Growth Rate' : 'Net Profit'
                          ]}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="growthRate"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="profit"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--success))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">Growth Rate (%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-sm text-muted-foreground">Net Profit ($)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Financial Analytics Section */}
          <section className="space-y-4">
            <SectionHeader 
              title="Financial Analytics"
              description="Visual breakdown of revenue, expenses, and profit trends"
              icon={BarChart3}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue by Service */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Revenue by Service Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByService}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {revenueByService.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SERVICE_COLORS[entry.name as keyof typeof SERVICE_COLORS] || EXPENSE_COLORS[index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Expenses by Category */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {expensesByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {expensesByCategory.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-xs">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Profit Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Profit Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profitTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Profit']}
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--success))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* Customer Detail Dialog */}
      <CustomerDetailDialog
        customer={customerToView}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </div>
  );
}

// Inline number edit component for financial fields
function InlineNumberEdit({ 
  value, 
  onChange, 
  className 
}: { 
  value: number; 
  onChange: (value: number) => void;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = () => {
    const numValue = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setEditValue(value.toString());
            setIsEditing(false);
          }
        }}
        className="h-7 w-24 text-sm text-right"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => {
        setEditValue(value.toString());
        setIsEditing(true);
      }}
      className={cn(
        "px-2 py-1 -mx-2 rounded hover:bg-muted/50 transition-colors text-sm",
        className
      )}
    >
      ${value.toLocaleString()}
    </button>
  );
}
