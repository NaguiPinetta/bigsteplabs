# Fix Supabase CLI Issues

## 🔧 **Step-by-Step Solution:**

### **1. Check Supabase CLI Installation**

```bash
# Check if Supabase CLI is installed
supabase --version

# If not installed, install it
npm install -g supabase
```

### **2. Login to Supabase**

```bash
# Login to your Supabase account
supabase login
```

### **3. Link Your Project**

```bash
# Link to your specific project
supabase link --project-ref oegldjlecdhxheiwtxxu
```

### **4. Check Project Status**

```bash
# Check if the project is properly linked
supabase status
```

### **5. If CLI Still Doesn't Work**

#### **Option A: Use Supabase Dashboard (Recommended)**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **SQL Editor**
3. Run the SQL scripts manually:
   - Copy and paste the contents of `apply_password_migration.sql`
   - Run it in the SQL Editor

#### **Option B: Reset Supabase CLI**

```bash
# Unlink current project
supabase unlink

# Clear Supabase cache
rm -rf ~/.supabase

# Reinstall Supabase CLI
npm uninstall -g supabase
npm install -g supabase

# Login and link again
supabase login
supabase link --project-ref oegldjlecdhxheiwtxxu
```

#### **Option C: Use Different Project Reference**

If the project reference is wrong, find the correct one:

1. Go to your Supabase Dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Copy the **Reference ID** (it should look like `oegldjlecdhxheiwtxxu`)
5. Use that ID in the link command

### **6. Test Database Connection**

```bash
# Test if you can connect to the database
supabase db pull
```

## 🚨 **Common Issues:**

### **Issue: "Project not found"**

- Make sure you're using the correct project reference ID
- Ensure you're logged in with the correct account
- Check if the project exists in your dashboard

### **Issue: "Permission denied"**

- Make sure you have admin access to the project
- Try logging out and back in: `supabase logout && supabase login`

### **Issue: "Connection timeout"**

- Check your internet connection
- Try using a different network
- Contact Supabase support if the issue persists

## ✅ **Success Indicators:**

- `supabase status` shows your project details
- `supabase db pull` downloads your current schema
- `supabase db push` applies migrations successfully
