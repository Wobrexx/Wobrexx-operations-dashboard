import { db } from './database';
import { supabase } from './supabase';
import type {
  Customer,
  Automation,
  Project,
  Expense,
  Note,
  PaymentHistory,
  Budget,
} from '@/contexts/DashboardContext';

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Helper to check if online
const isOnline = () => navigator.onLine;

// Transform Supabase data to app format
const transformCustomer = (row: any): Customer => ({
  id: row.id,
  companyName: row.company_name,
  country: row.country,
  serviceType: row.service_type,
  status: row.status,
  maintenance: row.maintenance,
  monthlyRevenue: parseFloat(row.monthly_revenue) || 0,
  notes: row.notes || '',
  businessStartDate: row.business_start_date,
  closingDate: row.closing_date,
  projectPayment: {
    estimatedCost: parseFloat(row.project_payment_estimated_cost) || 0,
    amountPaid: parseFloat(row.project_payment_amount_paid) || 0,
  },
  maintenancePayment: {
    estimatedCost: parseFloat(row.maintenance_payment_estimated_cost) || 0,
    amountPaid: parseFloat(row.maintenance_payment_amount_paid) || 0,
  },
  newRequirementPayment: {
    estimatedCost: parseFloat(row.new_requirement_payment_estimated_cost) || 0,
    amountPaid: parseFloat(row.new_requirement_payment_amount_paid) || 0,
  },
  maintenanceDueDate: row.maintenance_due_date,
  maintenancePaidMonths: row.maintenance_paid_months || [],
});

const transformCustomerToSupabase = (customer: Customer) => ({
  id: customer.id,
  company_name: customer.companyName,
  country: customer.country,
  service_type: customer.serviceType,
  status: customer.status,
  maintenance: customer.maintenance,
  monthly_revenue: customer.monthlyRevenue,
  notes: customer.notes,
  business_start_date: customer.businessStartDate,
  closing_date: customer.closingDate,
  project_payment_estimated_cost: customer.projectPayment.estimatedCost,
  project_payment_amount_paid: customer.projectPayment.amountPaid,
  maintenance_payment_estimated_cost: customer.maintenancePayment.estimatedCost,
  maintenance_payment_amount_paid: customer.maintenancePayment.amountPaid,
  new_requirement_payment_estimated_cost: customer.newRequirementPayment.estimatedCost,
  new_requirement_payment_amount_paid: customer.newRequirementPayment.amountPaid,
  maintenance_due_date: customer.maintenanceDueDate,
  maintenance_paid_months: customer.maintenancePaidMonths || [],
});

const transformAutomation = (row: any): Automation => ({
  id: row.id,
  clientName: row.client_name,
  automationName: row.automation_name,
  runtime: row.runtime || 0,
  executionCount: row.execution_count || 0,
  status: row.status,
  manualIntervention: row.manual_intervention || false,
});

const transformAutomationToSupabase = (automation: Automation) => ({
  id: automation.id,
  client_name: automation.clientName,
  automation_name: automation.automationName,
  runtime: automation.runtime,
  execution_count: automation.executionCount,
  status: automation.status,
  manual_intervention: automation.manualIntervention,
});

const transformProject = (row: any): Project => ({
  id: row.id,
  clientName: row.client_name,
  projectName: row.project_name,
  status: row.status,
  maintenance: row.maintenance,
  revenue: parseFloat(row.revenue) || 0,
  notes: row.notes || '',
  type: row.type,
  startDate: row.start_date,
});

const transformProjectToSupabase = (project: Project) => ({
  id: project.id,
  client_name: project.clientName,
  project_name: project.projectName,
  status: project.status,
  maintenance: project.maintenance,
  revenue: project.revenue,
  notes: project.notes,
  type: project.type,
  start_date: project.startDate,
});

const transformExpense = (row: any): Expense => ({
  id: row.id,
  category: row.category,
  description: row.description,
  amount: parseFloat(row.amount) || 0,
  recurring: row.recurring,
  dueDate: row.due_date,
  isPaid: row.is_paid || false,
});

const transformExpenseToSupabase = (expense: Expense) => ({
  id: expense.id,
  category: expense.category,
  description: expense.description,
  amount: expense.amount,
  recurring: expense.recurring,
  due_date: expense.dueDate,
  is_paid: expense.isPaid,
});

const transformNote = (row: any): Note => ({
  id: row.id,
  content: row.content,
  type: row.type,
  completed: row.completed || false,
  date: row.date || '',
});

const transformNoteToSupabase = (note: Note) => ({
  id: note.id,
  content: note.content,
  type: note.type,
  completed: note.completed,
  date: note.date,
});

const transformPaymentHistory = (row: any): PaymentHistory => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  paymentType: row.payment_type,
  amount: parseFloat(row.amount) || 0,
  date: row.date,
  notes: row.notes,
});

const transformPaymentHistoryToSupabase = (payment: PaymentHistory) => ({
  id: payment.id,
  customer_id: payment.customerId,
  customer_name: payment.customerName,
  payment_type: payment.paymentType,
  amount: payment.amount,
  date: payment.date,
  notes: payment.notes,
});

const transformBudget = (row: any): Budget => ({
  id: row.id,
  category: row.category,
  monthlyTarget: parseFloat(row.monthly_target) || 0,
  month: row.month,
});

const transformBudgetToSupabase = (budget: Budget) => ({
  id: budget.id,
  category: budget.category,
  monthly_target: budget.monthlyTarget,
  month: budget.month,
});

// Sync Service
export class SyncService {
  private static syncInProgress = false;

  // Load all data from Supabase (if online and configured) or IndexedDB
  static async loadAllData() {
    if (isSupabaseConfigured() && isOnline()) {
      try {
        console.log('🔄 Loading data from Supabase...');
        const data = await this.loadFromSupabase();
        
        // Save to IndexedDB as cache
        await this.saveToIndexedDB(data);
        
        console.log('✅ Data loaded from Supabase');
        return data;
      } catch (error) {
        console.warn('⚠️ Failed to load from Supabase, using IndexedDB cache:', error);
      }
    }
    
    // Fallback to IndexedDB
    console.log('📦 Loading data from IndexedDB cache...');
    return await this.loadFromIndexedDB();
  }

  // Load from Supabase
  private static async loadFromSupabase() {
    const [customersRes, automationsRes, projectsRes, expensesRes, notesRes, paymentHistoryRes, budgetsRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('automations').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('notes').select('*'),
      supabase.from('payment_history').select('*'),
      supabase.from('budgets').select('*'),
    ]);

    return {
      customers: (customersRes.data || []).map(transformCustomer),
      automations: (automationsRes.data || []).map(transformAutomation),
      projects: (projectsRes.data || []).map(transformProject),
      expenses: (expensesRes.data || []).map(transformExpense),
      notes: (notesRes.data || []).map(transformNote),
      paymentHistory: (paymentHistoryRes.data || []).map(transformPaymentHistory),
      budgets: (budgetsRes.data || []).map(transformBudget),
    };
  }

  // Load from IndexedDB
  private static async loadFromIndexedDB() {
    return {
      customers: await db.customers.toArray(),
      automations: await db.automations.toArray(),
      projects: await db.projects.toArray(),
      expenses: await db.expenses.toArray(),
      notes: await db.notes.toArray(),
      paymentHistory: await db.paymentHistory.toArray(),
      budgets: await db.budgets.toArray(),
    };
  }

  // Save to IndexedDB
  private static async saveToIndexedDB(data: any) {
    await Promise.all([
      db.customers.bulkPut(data.customers),
      db.automations.bulkPut(data.automations),
      db.projects.bulkPut(data.projects),
      db.expenses.bulkPut(data.expenses),
      db.notes.bulkPut(data.notes),
      db.paymentHistory.bulkPut(data.paymentHistory),
      db.budgets.bulkPut(data.budgets),
    ]);
  }

  // Sync to Supabase (upsert)
  static async syncToSupabase(
    table: string,
    items: any[],
    transformFn: (item: any) => any
  ) {
    if (!isSupabaseConfigured() || !isOnline()) {
      return; // Just save to IndexedDB if offline or not configured
    }

    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const transformed = items.map(transformFn);
      const { error } = await supabase.from(table).upsert(transformed, {
        onConflict: 'id',
      });

      if (error) {
        console.error(`Error syncing ${table} to Supabase:`, error);
      } else {
        console.log(`✅ Synced ${items.length} ${table} to Supabase`);
      }
    } catch (error) {
      console.error(`Error syncing ${table}:`, error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Delete from Supabase
  static async deleteFromSupabase(table: string, id: string) {
    if (!isSupabaseConfigured() || !isOnline()) {
      return;
    }

    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        console.error(`Error deleting ${table} from Supabase:`, error);
      }
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
    }
  }

  // Sync all tables
  static async syncAll(
    customers: Customer[],
    automations: Automation[],
    projects: Project[],
    expenses: Expense[],
    notes: Note[],
    paymentHistory: PaymentHistory[],
    budgets: Budget[]
  ) {
    await Promise.all([
      this.syncToSupabase('customers', customers, transformCustomerToSupabase),
      this.syncToSupabase('automations', automations, transformAutomationToSupabase),
      this.syncToSupabase('projects', projects, transformProjectToSupabase),
      this.syncToSupabase('expenses', expenses, transformExpenseToSupabase),
      this.syncToSupabase('notes', notes, transformNoteToSupabase),
      this.syncToSupabase('payment_history', paymentHistory, transformPaymentHistoryToSupabase),
      this.syncToSupabase('budgets', budgets, transformBudgetToSupabase),
    ]);
  }
}

