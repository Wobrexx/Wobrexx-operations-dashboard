import { db } from '@/lib/database';

/**
 * Utility functions to access and view database data
 * These can be used in the browser console
 */

// Expose database to window for console access
if (typeof window !== 'undefined') {
  (window as any).db = db;
  (window as any).viewAllData = async () => {
    const [customers, automations, projects, expenses, notes, paymentHistory, budgets] = await Promise.all([
      db.customers.toArray(),
      db.automations.toArray(),
      db.projects.toArray(),
      db.expenses.toArray(),
      db.notes.toArray(),
      db.paymentHistory.toArray(),
      db.budgets.toArray(),
    ]);
    
    console.log('=== WOBREXX DATABASE DATA ===');
    console.log('\n📊 Customers:', customers);
    console.log('\n🤖 Automations:', automations);
    console.log('\n💼 Projects:', projects);
    console.log('\n💰 Expenses:', expenses);
    console.log('\n📝 Notes:', notes);
    console.log('\n💳 Payment History:', paymentHistory);
    console.log('\n📈 Budgets:', budgets);
    console.log('\n=== END OF DATA ===');
    
    return {
      customers,
      automations,
      projects,
      expenses,
      notes,
      paymentHistory,
      budgets,
    };
  };
  
  (window as any).clearAllData = async () => {
    if (confirm('⚠️ Are you sure you want to delete ALL data? This cannot be undone!')) {
      await Promise.all([
        db.customers.clear(),
        db.automations.clear(),
        db.projects.clear(),
        db.expenses.clear(),
        db.notes.clear(),
        db.paymentHistory.clear(),
        db.budgets.clear(),
      ]);
      console.log('✅ All data cleared! Refresh the page to see changes.');
      return true;
    }
    return false;
  };
  
  (window as any).exportData = async () => {
    const data = await (window as any).viewAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wobrexx-database-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ Data exported to JSON file!');
  };
  
  console.log('%c🗄️ Database Access', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
  console.log('%cAvailable commands:', 'color: #2196F3; font-weight: bold;');
  console.log('  • viewAllData() - View all data in console');
  console.log('  • db.customers.toArray() - Get all customers');
  console.log('  • db.projects.toArray() - Get all projects');
  console.log('  • db.expenses.toArray() - Get all expenses');
  console.log('  • exportData() - Export all data as JSON file');
  console.log('  • clearAllData() - Clear all data (use with caution!)');
}

