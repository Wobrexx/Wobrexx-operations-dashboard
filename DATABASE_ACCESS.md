# Database Access Guide

This project uses **IndexedDB** (via Dexie.js) to store all data locally in your browser. Here are multiple ways to access and view your database data.

## Method 1: Browser Console (Easiest) 🎯

The database is automatically exposed to the browser console when the app loads.

### Steps:
1. Open your app in the browser (`http://localhost:8080`)
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. You'll see a message with available commands

### Available Console Commands:

```javascript
// View all data in a formatted way
viewAllData()

// Access specific tables
db.customers.toArray()        // Get all customers
db.projects.toArray()          // Get all projects
db.automations.toArray()       // Get all automations
db.expenses.toArray()          // Get all expenses
db.notes.toArray()            // Get all notes
db.paymentHistory.toArray()    // Get all payment history
db.budgets.toArray()           // Get all budgets

// Export all data as JSON file
exportData()

// Clear all data (use with caution!)
clearAllData()
```

### Example Usage:

```javascript
// View all customers
const customers = await db.customers.toArray();
console.table(customers);

// Find a specific customer
const customer = await db.customers.get('customer-id-here');
console.log(customer);

// Count records
const count = await db.customers.count();
console.log(`Total customers: ${count}`);

// Search customers
const activeCustomers = await db.customers
  .where('status')
  .equals('Active')
  .toArray();
console.log(activeCustomers);
```

## Method 2: Browser DevTools Application Tab 🔍

### Steps:
1. Open Developer Tools (F12)
2. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. In the left sidebar, expand **IndexedDB**
4. Click on **WobrexxOperationsDashboard**
5. You'll see all your tables:
   - customers
   - automations
   - projects
   - expenses
   - notes
   - paymentHistory
   - budgets
6. Click on any table to view its data

### Viewing Data:
- Click on a table name to see all records
- Click on a record to see its details in JSON format
- You can edit values directly (double-click to edit)

## Method 3: Programmatic Access in Code 💻

You can import and use the database in your React components:

```typescript
import { db } from '@/lib/database';

// In a component or function
const fetchCustomers = async () => {
  const customers = await db.customers.toArray();
  return customers;
};

// Add a new customer
const addCustomer = async (customer: Customer) => {
  await db.customers.add(customer);
};

// Update a customer
const updateCustomer = async (id: string, updates: Partial<Customer>) => {
  await db.customers.update(id, updates);
};

// Delete a customer
const deleteCustomer = async (id: string) => {
  await db.customers.delete(id);
};
```

## Method 4: Export/Import Data 📥📤

### Export Data:
```javascript
// In browser console
exportData()
// This will download a JSON file with all your data
```

### Import Data (Manual):
1. Export your data first using `exportData()`
2. To restore, you can use:
```javascript
// In browser console
const data = /* paste your JSON data here */;
await db.customers.bulkPut(data.customers);
await db.projects.bulkPut(data.projects);
// ... etc for other tables
```

## Database Schema 📊

The database contains the following tables:

| Table | Primary Key | Indexed Fields |
|-------|------------|----------------|
| customers | id | companyName, status, country |
| automations | id | clientName, status |
| projects | id | clientName, status, type |
| expenses | id | category, recurring, dueDate |
| notes | id | type, completed, date |
| paymentHistory | id | customerId, paymentType, date |
| budgets | id | category, month |

## Useful Dexie Queries 🔎

```javascript
// Get all active customers
await db.customers
  .where('status')
  .equals('Active')
  .toArray();

// Get customers by country
await db.customers
  .where('country')
  .equals('Germany')
  .toArray();

// Get expenses for a specific month
await db.expenses
  .where('dueDate')
  .between('2026-01-01', '2026-01-31')
  .toArray();

// Get payment history for a customer
await db.paymentHistory
  .where('customerId')
  .equals('customer-id')
  .toArray();

// Count total records
const totalCustomers = await db.customers.count();
const totalExpenses = await db.expenses.count();
```

## Clear Database 🗑️

### Clear All Data:
```javascript
// In browser console
clearAllData()
```

### Clear Specific Table:
```javascript
await db.customers.clear();
await db.projects.clear();
// etc.
```

## Database Location 💾

The IndexedDB database is stored locally in your browser:
- **Chrome/Edge**: `%LocalAppData%\Google\Chrome\User Data\Default\IndexedDB\`
- **Firefox**: `%AppData%\Mozilla\Firefox\Profiles\[profile]\storage\default\`
- **Safari**: `~/Library/Safari/LocalStorage/`

**Note**: Each browser stores IndexedDB data separately. Data is not shared between browsers.

## Troubleshooting 🔧

### Database not loading?
1. Check browser console for errors
2. Make sure you're on the same domain (localhost:8080)
3. Try clearing browser cache and reloading

### Can't see data?
1. Make sure you've added some data through the UI first
2. Check the Application tab in DevTools
3. Try running `viewAllData()` in console

### Data disappeared?
- IndexedDB data is per-browser and per-domain
- Clearing browser data will delete it
- Using incognito/private mode uses separate storage

## Security Note 🔒

- IndexedDB data is stored locally in your browser
- It's only accessible by your website (same origin policy)
- Data persists even after closing the browser
- To share data between devices, you'd need to implement export/import functionality

