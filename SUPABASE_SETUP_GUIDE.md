# 🔧 Supabase Configuration Fix Guide

## 🚨 **CRITICAL ISSUE: Invalid API Key**

The application is failing with **"Invalid API key"** errors because the Supabase publishable key in your `.env` file is **truncated or invalid**.

## 🔍 **Current Problem**

Your current `.env` file has:

```
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_78no_J6n-Z-JlSoq5k6HSA_Z0srOt1sG
```

This key is **incomplete** and causing all authentication and data loading to fail.

## ✅ **How to Fix**

### **Step 1: Get Your Correct Supabase Keys**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `oegldjlecdhxheiwtxxu`
3. Go to **Settings** → **API**
4. Copy the **anon public** key (this is your publishable key)

### **Step 2: Update Your .env File**

Replace the current publishable key with the correct one:

```bash
# Current (INVALID):
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_78no_J6n-Z-JlSoq5k6HSA_Z0srOt1sG

# Replace with your actual anon public key from Supabase Dashboard
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZ2xkamxlY2RoeGhlaXd0eHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDMxNzYsImV4cCI6MjA2ODU3OTE3Nn0.YOUR_ACTUAL_KEY_HERE
```

### **Step 3: Verify the Fix**

1. Restart your development server:

   ```bash
   npm run dev
   ```

2. Visit the environment test page:

   ```
   http://localhost:5173/env-test
   ```

3. Check that both variables show as "SET"

4. Try logging in again - the "Invalid API key" error should be gone

## 🔑 **Key Format**

A valid Supabase publishable key should:

- Start with `eyJ` (JWT format)
- Be much longer than the current truncated key
- Be labeled as "anon public" in Supabase Dashboard

## 🚀 **After Fixing**

Once you have the correct keys:

- ✅ Authentication will work
- ✅ Data loading will work (agents, models, datasets, personas)
- ✅ Chat functionality will work
- ✅ All CRUD operations will work

## 📝 **Note**

The service role key looks correct, but the publishable key is the one causing the authentication failures. The publishable key is safe to expose in frontend code and is required for all client-side operations.
