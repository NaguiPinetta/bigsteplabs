# 🚀 BigStepLabs 2.0 - Vercel Deployment Guide

## Prerequisites

1. **Supabase Project** - Set up and configured
2. **Vercel Account** - Connected to your GitHub repository
3. **Environment Variables** - Ready to configure

## Step 1: Set Up Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Run the migrations:**
   ```bash
   supabase db push
   ```
3. **Get your credentials:**
   - Go to Settings → API
   - Copy Project URL and anon public key

## Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**
2. **Select your project** (bigsteplabs)
3. **Go to Settings → Environment Variables**
4. **Add these variables:**

### Required Variables:

```
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

### Optional Variables (for AI features):

```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

## Step 3: Deploy

1. **Push your code to GitHub**
2. **Vercel will automatically deploy**
3. **Or manually redeploy** from Vercel dashboard

## Step 4: Verify Deployment

1. **Check the deployment logs** for any errors
2. **Test the application** at your Vercel URL
3. **Run database tests** at `/test-db`

## Troubleshooting

### Build Fails with Environment Variable Error

- **Solution:** Add missing environment variables in Vercel dashboard
- **Error:** `"PUBLIC_SUPABASE_URL" is not exported`

### Database Connection Issues

- **Solution:** Verify Supabase URL and key are correct
- **Check:** Supabase project is active and accessible

### AI Features Not Working

- **Solution:** Add OpenAI/Anthropic API keys to environment variables
- **Test:** Use the test page at `/test-db`

## Environment Variables Reference

| Variable                          | Required | Description                   |
| --------------------------------- | -------- | ----------------------------- |
| `PUBLIC_SUPABASE_URL`             | ✅       | Your Supabase project URL     |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅       | Your Supabase anon public key |
| `OPENAI_API_KEY`                  | ❌       | For OpenAI AI models          |
| `ANTHROPIC_API_KEY`               | ❌       | For Anthropic AI models       |
| `GOOGLE_AI_API_KEY`               | ❌       | For Google AI models          |

## Production Checklist

- [ ] Environment variables configured
- [ ] Supabase database migrated
- [ ] Build successful
- [ ] Application accessible
- [ ] Database tests passing
- [ ] AI features working (if configured)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connection
4. Review Supabase project status
