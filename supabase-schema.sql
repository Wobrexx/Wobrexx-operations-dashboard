-- Wobrexx Operations Dashboard - Supabase Schema
-- Run this in Supabase SQL Editor to create all tables

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  country TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('Website', 'Software', 'Automation', 'Mixed')),
  status TEXT NOT NULL CHECK (status IN ('Active', 'Paused', 'Opted Out')),
  maintenance BOOLEAN NOT NULL DEFAULT false,
  monthly_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  business_start_date TEXT,
  closing_date TEXT,
  project_payment_estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  project_payment_amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  maintenance_payment_estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  maintenance_payment_amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  new_requirement_payment_estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  new_requirement_payment_amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  maintenance_due_date TEXT,
  maintenance_paid_months TEXT[], -- Array of 'YYYY-MM' strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automations table
CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  automation_name TEXT NOT NULL,
  runtime INTEGER NOT NULL DEFAULT 0,
  execution_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Healthy', 'Warning', 'Failed')),
  manual_intervention BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Live', 'Development', 'Paused', 'Completed')),
  maintenance BOOLEAN NOT NULL DEFAULT false,
  revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('Website', 'Software', 'Automation')),
  start_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  recurring BOOLEAN NOT NULL DEFAULT false,
  due_date TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'todo', 'reminder')),
  completed BOOLEAN NOT NULL DEFAULT false,
  date TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment History table
CREATE TABLE IF NOT EXISTS payment_history (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('project', 'maintenance', 'newRequirement')),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  monthly_target NUMERIC(10, 2) NOT NULL DEFAULT 0,
  month TEXT NOT NULL, -- 'YYYY-MM' format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, month)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_automations_client_name ON automations(client_name);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_name ON projects(client_name);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_payment_history_customer_id ON payment_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(date);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

