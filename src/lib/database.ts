import Dexie, { Table } from 'dexie';
import type { 
  Customer, 
  Automation, 
  Project, 
  Expense, 
  Note, 
  PaymentHistory, 
  Budget 
} from '@/contexts/DashboardContext';

// Define the database schema
export class DashboardDatabase extends Dexie {
  customers!: Table<Customer, string>;
  automations!: Table<Automation, string>;
  projects!: Table<Project, string>;
  expenses!: Table<Expense, string>;
  notes!: Table<Note, string>;
  paymentHistory!: Table<PaymentHistory, string>;
  budgets!: Table<Budget, string>;

  constructor() {
    super('WobrexxOperationsDashboard');
    
    // Define schema
    this.version(1).stores({
      customers: 'id, companyName, status, country',
      automations: 'id, clientName, status',
      projects: 'id, clientName, status, type',
      expenses: 'id, category, recurring, dueDate',
      notes: 'id, type, completed, date',
      paymentHistory: 'id, customerId, paymentType, date',
      budgets: 'id, category, month',
    });
  }
}

// Create and export a singleton instance
export const db = new DashboardDatabase();

