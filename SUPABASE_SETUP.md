# Supabase Setup Guide

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub (recommended) or email

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in:
   - **Name**: `Wobrexx Operations Dashboard` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 2-3 minutes for project to be ready

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** (gear icon)
2. Click **API** in the left sidebar
3. You'll see:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## Step 4: Set Up Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add these variables:

```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 5: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy and paste the SQL from `supabase-schema.sql` file
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 6: Set Up Row Level Security (RLS)

Since this is a single-user dashboard, we'll disable RLS for simplicity. In production, you'd want to enable it with proper policies.

1. Go to **Authentication** → **Policies** in Supabase
2. For each table, you can either:
   - **Option A (Simple)**: Disable RLS temporarily for testing
   - **Option B (Recommended)**: Create policies that allow all operations

For Option B, run this SQL in the SQL Editor:

```sql
-- Enable RLS but allow all operations (for single-user app)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on automations" ON automations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on payment_history" ON payment_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
```

## Step 7: Restart Your Dev Server

After setting up environment variables:

```bash
npm run dev
```

## Step 8: Verify Connection

1. Open your app in the browser
2. Open Developer Console (F12)
3. You should see connection status messages
4. Try adding a customer - it should sync to Supabase!

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart dev server after adding env variables

### "relation does not exist" error
- Make sure you ran the SQL schema in Step 5
- Check that table names match exactly

### RLS Policy errors
- Make sure you created the policies in Step 6
- Or temporarily disable RLS in table settings

### Connection issues
- Check that your Supabase project is active (not paused)
- Verify URL and key are correct
- Check browser console for detailed error messages

## Free Tier Limits

- **Database Size**: 500 MB
- **Bandwidth**: 2 GB/month
- **API Requests**: 2 million/month
- **File Storage**: 1 GB

For a small operations dashboard, this should be more than enough!

## Next Steps

Once set up, your data will:
- ✅ Sync across all devices
- ✅ Persist on Supabase servers
- ✅ Work offline (with IndexedDB cache)
- ✅ Auto-sync when connection is restored

