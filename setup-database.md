# Database Setup Guide

## 🚨 **Critical Issue: Database Not Set Up**

Your BigStepLabs application is getting 401 errors because the database tables haven't been created in your Supabase project yet.

## 🔧 **How to Fix This:**

### **Option 1: Use Supabase Dashboard (Recommended)**

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Run the migration files in order:**

#### **Step 1: Run Initial Schema**

Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` into the SQL Editor and run it.

#### **Step 2: Run RLS Policies**

Copy and paste the contents of `supabase/migrations/002_rls_policies.sql` into the SQL Editor and run it.

#### **Step 3: Run Storage Setup**

Copy and paste the contents of `supabase/migrations/003_storage_setup.sql` into the SQL Editor and run it.

#### **Step 4: Run Seed Data**

Copy and paste the contents of `supabase/migrations/004_seed_data.sql` into the SQL Editor and run it.

### **Option 2: Use Supabase CLI**

If you have Supabase CLI installed:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref oegldjlecdhxheiwtxxu

# Push the migrations
supabase db push
```

## ✅ **After Setup:**

Once you've run the migrations, your application should:

- ✅ Load data from all modules (Datasets, Personas, Models, Agents, etc.)
- ✅ Show proper navigation bars in admin pages
- ✅ Allow authentication to work properly

## 🎯 **Current Status:**

- ❌ Database tables missing → 401 errors
- ❌ No data showing in modules
- ✅ Environment variables working
- ✅ Authentication UI working
- ✅ Navigation structure ready

**Run the database migrations and your app will work perfectly!** 🚀
