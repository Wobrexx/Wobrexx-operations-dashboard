import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { db } from '@/lib/database';

export interface PaymentInfo {
  estimatedCost: number;
  amountPaid: number;
}

export interface Customer {
  id: string;
  companyName: string;
  country: string;
  serviceType: 'Website' | 'Software' | 'Automation' | 'Mixed';
  status: 'Active' | 'Paused' | 'Opted Out';
  maintenance: boolean;
  monthlyRevenue: number;
  notes: string;
  businessStartDate?: string;
  closingDate?: string;
  // Financial fields
  projectPayment: PaymentInfo;
  maintenancePayment: PaymentInfo;
  newRequirementPayment: PaymentInfo;
  maintenanceDueDate?: string;
  maintenancePaidMonths?: string[]; // Array of 'YYYY-MM' strings
}

export interface Automation {
  id: string;
  clientName: string;
  automationName: string;
  runtime: number;
  executionCount: number;
  status: 'Healthy' | 'Warning' | 'Failed';
  manualIntervention: boolean;
}

export interface Project {
  id: string;
  clientName: string;
  projectName: string;
  status: 'Live' | 'Development' | 'Paused' | 'Completed';
  maintenance: boolean;
  revenue: number;
  notes: string;
  type: 'Website' | 'Software' | 'Automation';
  startDate?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  recurring: boolean;
  dueDate?: string;
  isPaid: boolean;
}

export interface Budget {
  id: string;
  category: string;
  monthlyTarget: number;
  month: string; // 'YYYY-MM' format
}

export interface Note {
  id: string;
  content: string;
  type: 'note' | 'todo' | 'reminder';
  completed: boolean;
  date: string;
}

export interface PaymentHistory {
  id: string;
  customerId: string;
  customerName: string;
  paymentType: 'project' | 'maintenance' | 'newRequirement';
  amount: number;
  date: string;
  notes?: string;
}

export interface KPIs {
  totalCustomers: number;
  activeCustomers: number;
  optedOutCustomers: number;
  customersWithoutMaintenance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
}

export interface AutomationKPIs {
  totalAutomations: number;
  monthlyRuntime: number;
  monthlyExecutions: number;
  failedAutomations: number;
}

export interface FinancialKPIs {
  mrr: number;
  oneTimeRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export interface ChartData {
  revenueExpenses: { month: string; revenue: number; expenses: number }[];
  serviceDistribution: { name: string; value: number }[];
  customerStatus: { status: string; count: number }[];
}

interface DashboardContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: 'monthly' | 'quarterly' | 'yearly';
  setViewMode: (mode: 'monthly' | 'quarterly' | 'yearly') => void;
  kpis: KPIs;
  setKPIs: (kpis: KPIs) => void;
  automationKPIs: AutomationKPIs;
  setAutomationKPIs: (kpis: AutomationKPIs) => void;
  financialKPIs: FinancialKPIs;
  setFinancialKPIs: (kpis: FinancialKPIs) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  automations: Automation[];
  setAutomations: (automations: Automation[]) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  chartData: ChartData;
  setChartData: (data: ChartData) => void;
  paymentHistory: PaymentHistory[];
  setPaymentHistory: (history: PaymentHistory[]) => void;
  addPaymentRecord: (record: Omit<PaymentHistory, 'id'>) => void;
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  isLoading: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Helper function to calculate KPIs from data
const calculateKPIs = (customers: Customer[], expenses: Expense[]): KPIs => {
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const optedOutCustomers = customers.filter(c => c.status === 'Opted Out').length;
  const customersWithoutMaintenance = customers.filter(c => !c.maintenance && c.status === 'Active').length;
  const monthlyRevenue = customers
    .filter(c => c.status === 'Active')
    .reduce((sum, c) => sum + c.monthlyRevenue, 0);
  const monthlyExpenses = expenses
    .filter(e => e.recurring || (e.dueDate && new Date(e.dueDate).getMonth() === new Date().getMonth()))
    .reduce((sum, e) => sum + e.amount, 0);
  
  return {
    totalCustomers: customers.length,
    activeCustomers,
    optedOutCustomers,
    customersWithoutMaintenance,
    monthlyRevenue,
    monthlyExpenses,
    netProfit: monthlyRevenue - monthlyExpenses,
  };
};

const calculateAutomationKPIs = (automations: Automation[]): AutomationKPIs => {
  const failedAutomations = automations.filter(a => a.status === 'Failed').length;
  const monthlyRuntime = automations.reduce((sum, a) => sum + a.runtime, 0);
  const monthlyExecutions = automations.reduce((sum, a) => sum + a.executionCount, 0);
  
  return {
    totalAutomations: automations.length,
    monthlyRuntime,
    monthlyExecutions,
    failedAutomations,
  };
};

const calculateFinancialKPIs = (
  customers: Customer[],
  expenses: Expense[],
  paymentHistory: PaymentHistory[]
): FinancialKPIs => {
  const mrr = customers
    .filter(c => c.status === 'Active')
    .reduce((sum, c) => sum + c.monthlyRevenue, 0);
  
  const oneTimeRevenue = paymentHistory
    .filter(p => p.paymentType === 'project' || p.paymentType === 'newRequirement')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  return {
    mrr,
    oneTimeRevenue,
    totalExpenses,
    netProfit: mrr + oneTimeRevenue - totalExpenses,
  };
};

const calculateChartData = (
  customers: Customer[],
  expenses: Expense[],
  paymentHistory: PaymentHistory[]
): ChartData => {
  // Calculate revenue/expenses for last 6 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const revenueExpenses = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    const monthDate = new Date();
    monthDate.setMonth(currentMonth - i);
    
    const revenue = customers
      .filter(c => c.status === 'Active')
      .reduce((sum, c) => sum + c.monthlyRevenue, 0);
    
    const monthExpenses = expenses
      .filter(e => {
        if (!e.dueDate) return false;
        const expenseDate = new Date(e.dueDate);
        return expenseDate.getMonth() === monthDate.getMonth() && 
               expenseDate.getFullYear() === monthDate.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
    
    revenueExpenses.push({
      month: monthName,
      revenue,
      expenses: monthExpenses,
    });
  }
  
  // Service distribution
  const serviceCounts: Record<string, number> = {};
  customers.forEach(c => {
    serviceCounts[c.serviceType] = (serviceCounts[c.serviceType] || 0) + 1;
  });
  const total = customers.length;
  const serviceDistribution = Object.entries(serviceCounts).map(([name, count]) => ({
    name,
    value: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
  
  // Customer status
  const statusCounts: Record<string, number> = {};
  customers.forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });
  const customerStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));
  
  return {
    revenueExpenses,
    serviceDistribution,
    customerStatus,
  };
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize with empty arrays
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // Calculate KPIs from data
  const [kpis, setKPIs] = useState<KPIs>({
    totalCustomers: 0,
    activeCustomers: 0,
    optedOutCustomers: 0,
    customersWithoutMaintenance: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0,
  });

  const [automationKPIs, setAutomationKPIs] = useState<AutomationKPIs>({
    totalAutomations: 0,
    monthlyRuntime: 0,
    monthlyExecutions: 0,
    failedAutomations: 0,
  });

  const [financialKPIs, setFinancialKPIs] = useState<FinancialKPIs>({
    mrr: 0,
    oneTimeRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  const [chartData, setChartData] = useState<ChartData>({
    revenueExpenses: [],
    serviceDistribution: [],
    customerStatus: [],
  });

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [customersData, automationsData, projectsData, expensesData, notesData, paymentHistoryData, budgetsData] = await Promise.all([
          db.customers.toArray(),
          db.automations.toArray(),
          db.projects.toArray(),
          db.expenses.toArray(),
          db.notes.toArray(),
          db.paymentHistory.toArray(),
          db.budgets.toArray(),
        ]);
        
        setCustomers(customersData);
        setAutomations(automationsData);
        setProjects(projectsData);
        setExpenses(expensesData);
        setNotes(notesData);
        setPaymentHistory(paymentHistoryData);
        setBudgets(budgetsData);
      } catch (error) {
        console.error('Error loading data from database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save data to database when state changes
  useEffect(() => {
    if (!isLoading) {
      db.customers.bulkPut(customers).catch(console.error);
    }
  }, [customers, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      db.automations.bulkPut(automations).catch(console.error);
    }
  }, [automations, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      db.projects.bulkPut(projects).catch(console.error);
    }
  }, [projects, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      db.expenses.bulkPut(expenses).catch(console.error);
    }
  }, [expenses, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      db.notes.bulkPut(notes).catch(console.error);
    }
  }, [notes, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      db.paymentHistory.bulkPut(paymentHistory).catch(console.error);
    }
  }, [paymentHistory, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      db.budgets.bulkPut(budgets).catch(console.error);
    }
  }, [budgets, isLoading]);

  // Update KPIs when data changes
  useEffect(() => {
    if (!isLoading) {
      setKPIs(calculateKPIs(customers, expenses));
      setAutomationKPIs(calculateAutomationKPIs(automations));
      setFinancialKPIs(calculateFinancialKPIs(customers, expenses, paymentHistory));
      setChartData(calculateChartData(customers, expenses, paymentHistory));
    }
  }, [customers, expenses, automations, paymentHistory, isLoading]);

  const addPaymentRecord = useCallback((record: Omit<PaymentHistory, 'id'>) => {
    const newRecord: PaymentHistory = {
      ...record,
      id: Date.now().toString(),
    };
    setPaymentHistory(prev => [newRecord, ...prev]);
    db.paymentHistory.add(newRecord).catch(console.error);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        viewMode,
        setViewMode,
        kpis,
        setKPIs,
        automationKPIs,
        setAutomationKPIs,
        financialKPIs,
        setFinancialKPIs,
        customers,
        setCustomers,
        automations,
        setAutomations,
        projects,
        setProjects,
        expenses,
        setExpenses,
        notes,
        setNotes,
        chartData,
        setChartData,
        paymentHistory,
        setPaymentHistory,
        addPaymentRecord,
        budgets,
        setBudgets,
        isLoading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
