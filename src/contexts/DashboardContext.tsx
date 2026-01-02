import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const defaultPayment: PaymentInfo = { estimatedCost: 0, amountPaid: 0 };

const initialCustomers: Customer[] = [
  { 
    id: '1', companyName: 'TechCorp GmbH', country: 'Germany', serviceType: 'Software', status: 'Active', 
    maintenance: true, monthlyRevenue: 2500, notes: 'Enterprise client', businessStartDate: '2024-03-15',
    projectPayment: { estimatedCost: 15000, amountPaid: 15000 },
    maintenancePayment: { estimatedCost: 500, amountPaid: 500 },
    newRequirementPayment: { estimatedCost: 0, amountPaid: 0 },
    maintenanceDueDate: '2026-02-01',
    maintenancePaidMonths: ['2025-12', '2026-01']
  },
  { 
    id: '2', companyName: 'Nordic Solutions AB', country: 'Sweden', serviceType: 'Website', status: 'Active', 
    maintenance: true, monthlyRevenue: 800, notes: 'Renewed Q4', businessStartDate: '2024-06-01',
    projectPayment: { estimatedCost: 5000, amountPaid: 5000 },
    maintenancePayment: { estimatedCost: 200, amountPaid: 200 },
    newRequirementPayment: { estimatedCost: 1000, amountPaid: 500 },
    maintenanceDueDate: '2026-02-01',
    maintenancePaidMonths: ['2025-12', '2026-01']
  },
  { 
    id: '3', companyName: 'Alpine Tech AG', country: 'Switzerland', serviceType: 'Automation', status: 'Active', 
    maintenance: false, monthlyRevenue: 1500, notes: 'Needs maintenance discussion', businessStartDate: '2024-08-20',
    projectPayment: { estimatedCost: 8000, amountPaid: 6000 },
    maintenancePayment: { estimatedCost: 0, amountPaid: 0 },
    newRequirementPayment: { estimatedCost: 2000, amountPaid: 2000 }
  },
  { 
    id: '4', companyName: 'Dutch Digital BV', country: 'Netherlands', serviceType: 'Mixed', status: 'Paused', 
    maintenance: false, monthlyRevenue: 0, notes: 'Paused since Nov 2024', businessStartDate: '2024-01-10', closingDate: '2024-11-15',
    projectPayment: { estimatedCost: 12000, amountPaid: 8000 },
    maintenancePayment: { estimatedCost: 0, amountPaid: 0 },
    newRequirementPayment: { estimatedCost: 0, amountPaid: 0 }
  },
  { 
    id: '5', companyName: 'Iberia Systems SL', country: 'Spain', serviceType: 'Website', status: 'Opted Out', 
    maintenance: false, monthlyRevenue: 0, notes: 'Left for competitor', businessStartDate: '2023-09-01', closingDate: '2025-01-05',
    projectPayment: { estimatedCost: 4000, amountPaid: 4000 },
    maintenancePayment: { estimatedCost: 0, amountPaid: 0 },
    newRequirementPayment: { estimatedCost: 0, amountPaid: 0 }
  },
  { 
    id: '6', companyName: 'Baltic Innovations', country: 'Estonia', serviceType: 'Automation', status: 'Active', 
    maintenance: true, monthlyRevenue: 1200, notes: 'Growing account', businessStartDate: '2024-10-01',
    projectPayment: { estimatedCost: 6000, amountPaid: 6000 },
    maintenancePayment: { estimatedCost: 300, amountPaid: 0 },
    newRequirementPayment: { estimatedCost: 500, amountPaid: 500 },
    maintenanceDueDate: '2026-01-15',
    maintenancePaidMonths: ['2025-12']
  },
];

const initialProjects: Project[] = [
  { id: '1', clientName: 'TechCorp GmbH', projectName: 'CRM Dashboard', status: 'Live', maintenance: true, revenue: 2500, notes: 'Monthly updates', type: 'Software' },
  { id: '2', clientName: 'Nordic Solutions AB', projectName: 'Corporate Website', status: 'Live', maintenance: true, revenue: 800, notes: '', type: 'Website' },
  { id: '3', clientName: 'Alpine Tech AG', projectName: 'Invoice Automation', status: 'Live', maintenance: false, revenue: 1500, notes: 'Needs review', type: 'Automation' },
  { id: '4', clientName: 'Baltic Innovations', projectName: 'Data Pipeline', status: 'Development', maintenance: false, revenue: 0, notes: 'Launch Q1', type: 'Automation' },
  { id: '5', clientName: 'Dutch Digital BV', projectName: 'E-commerce Site', status: 'Paused', maintenance: false, revenue: 0, notes: 'Client paused', type: 'Website' },
];

const initialAutomations: Automation[] = [
  { id: '1', clientName: 'TechCorp GmbH', automationName: 'Report Generator', runtime: 45, executionCount: 120, status: 'Healthy', manualIntervention: false },
  { id: '2', clientName: 'Alpine Tech AG', automationName: 'Invoice Processing', runtime: 22, executionCount: 85, status: 'Healthy', manualIntervention: false },
  { id: '3', clientName: 'Baltic Innovations', automationName: 'Data Sync', runtime: 68, executionCount: 240, status: 'Warning', manualIntervention: true },
  { id: '4', clientName: 'Nordic Solutions AB', automationName: 'Email Parser', runtime: 12, executionCount: 45, status: 'Healthy', manualIntervention: false },
  { id: '5', clientName: 'TechCorp GmbH', automationName: 'Backup Script', runtime: 8, executionCount: 30, status: 'Failed', manualIntervention: true },
];

const initialExpenses: Expense[] = [
  { id: '1', category: 'Infrastructure', description: 'Cloud hosting (AWS)', amount: 850, recurring: true },
  { id: '2', category: 'Software', description: 'Development tools licenses', amount: 320, recurring: true },
  { id: '3', category: 'Marketing', description: 'LinkedIn Ads campaign', amount: 500, recurring: false },
  { id: '4', category: 'Personnel', description: 'Contractor payment', amount: 2000, recurring: false },
  { id: '5', category: 'Office', description: 'Coworking space', amount: 450, recurring: true },
];

const initialNotes: Note[] = [
  { id: '1', content: 'Follow up with TechCorp GmbH about Q1 expansion', type: 'todo', completed: false, date: '2026-01-15' },
  { id: '2', content: 'Alpine Tech AG maintenance contract expires Feb 2026', type: 'reminder', completed: false, date: '2026-02-01' },
  { id: '3', content: 'Consider offering Baltic Innovations a premium tier', type: 'note', completed: false, date: '' },
  { id: '4', content: 'Prepare Q4 2025 financial report', type: 'todo', completed: true, date: '2026-01-10' },
];

const initialPaymentHistory: PaymentHistory[] = [
  { id: '1', customerId: '1', customerName: 'TechCorp GmbH', paymentType: 'project', amount: 15000, date: '2024-03-20', notes: 'Full project payment' },
  { id: '2', customerId: '1', customerName: 'TechCorp GmbH', paymentType: 'maintenance', amount: 500, date: '2025-12-01', notes: 'Dec 2025 maintenance' },
  { id: '3', customerId: '1', customerName: 'TechCorp GmbH', paymentType: 'maintenance', amount: 500, date: '2026-01-01', notes: 'Jan 2026 maintenance' },
  { id: '4', customerId: '2', customerName: 'Nordic Solutions AB', paymentType: 'project', amount: 5000, date: '2024-06-15', notes: 'Full project payment' },
  { id: '5', customerId: '2', customerName: 'Nordic Solutions AB', paymentType: 'maintenance', amount: 200, date: '2025-12-01', notes: 'Dec 2025 maintenance' },
  { id: '6', customerId: '2', customerName: 'Nordic Solutions AB', paymentType: 'newRequirement', amount: 500, date: '2025-11-15', notes: 'Additional feature request' },
  { id: '7', customerId: '3', customerName: 'Alpine Tech AG', paymentType: 'project', amount: 6000, date: '2024-09-01', notes: 'Partial payment' },
  { id: '8', customerId: '3', customerName: 'Alpine Tech AG', paymentType: 'newRequirement', amount: 2000, date: '2025-10-20', notes: 'New automation workflow' },
  { id: '9', customerId: '6', customerName: 'Baltic Innovations', paymentType: 'project', amount: 6000, date: '2024-10-15', notes: 'Full project payment' },
  { id: '10', customerId: '6', customerName: 'Baltic Innovations', paymentType: 'newRequirement', amount: 500, date: '2025-12-01', notes: 'API integration' },
];

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  
  const [kpis, setKPIs] = useState<KPIs>({
    totalCustomers: 6,
    activeCustomers: 4,
    optedOutCustomers: 1,
    customersWithoutMaintenance: 2,
    monthlyRevenue: 6000,
    monthlyExpenses: 4120,
    netProfit: 1880,
  });

  const [automationKPIs, setAutomationKPIs] = useState<AutomationKPIs>({
    totalAutomations: 5,
    monthlyRuntime: 155,
    monthlyExecutions: 520,
    failedAutomations: 1,
  });

  const [financialKPIs, setFinancialKPIs] = useState<FinancialKPIs>({
    mrr: 6000,
    oneTimeRevenue: 2500,
    totalExpenses: 4120,
    netProfit: 4380,
  });

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>(initialPaymentHistory);

  const [chartData, setChartData] = useState<ChartData>({
    revenueExpenses: [
      { month: 'Jul', revenue: 5200, expenses: 3800 },
      { month: 'Aug', revenue: 5500, expenses: 3900 },
      { month: 'Sep', revenue: 5800, expenses: 4000 },
      { month: 'Oct', revenue: 5600, expenses: 4100 },
      { month: 'Nov', revenue: 5900, expenses: 4050 },
      { month: 'Dec', revenue: 6000, expenses: 4120 },
    ],
    serviceDistribution: [
      { name: 'Website', value: 30 },
      { name: 'Software', value: 45 },
      { name: 'Automation', value: 25 },
    ],
    customerStatus: [
      { status: 'Active', count: 4 },
      { status: 'Paused', count: 1 },
      { status: 'Opted Out', count: 1 },
    ],
  });

  const addPaymentRecord = (record: Omit<PaymentHistory, 'id'>) => {
    const newRecord: PaymentHistory = {
      ...record,
      id: Date.now().toString(),
    };
    setPaymentHistory(prev => [newRecord, ...prev]);
  };

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
