# Quick Start - Supabase Setup

## 🚀 5-Minute Setup

### Step 1: Create Supabase Account & Project
1. Go to [https://supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in project details and wait 2-3 minutes

### Step 2: Get Your API Keys
1. In Supabase dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 3: Create Environment File
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Tables
1. In Supabase dashboard → **SQL Editor**
2. Click **New query**
3. Open `supabase-schema.sql` from this project
4. Copy all the SQL and paste it
5. Click **Run** (or Cmd/Ctrl + Enter)

### Step 5: Set Up Row Level Security
Run this in SQL Editor:

```sql
-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for single-user app)
CREATE POLICY "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON automations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON payment_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON budgets FOR ALL USING (true) WITH CHECK (true);
```

### Step 6: Restart Dev Server
```bash
npm run dev
```

### Step 7: Test It!
1. Open your app
2. Add a customer
3. Check Supabase dashboard → **Table Editor** → **customers**
4. Your data should be there! 🎉

## ✅ What You Get

- ✅ **Data syncs across all devices** (same Supabase account)
- ✅ **Works offline** (IndexedDB cache)
- ✅ **Auto-syncs when online**
- ✅ **Free forever** (within free tier limits)
- ✅ **500 MB storage** (plenty for operations dashboard)

## 🔍 Verify It's Working

Open browser console (F12) and you should see:
- `🔄 Loading data from Supabase...` (on first load)
- `✅ Data loaded from Supabase` (if connected)
- `✅ Synced X customers to Supabase` (when adding data)

## 📚 Full Documentation

See `SUPABASE_SETUP.md` for detailed instructions and troubleshooting.

