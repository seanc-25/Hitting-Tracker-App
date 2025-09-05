# 🚀 Deployment Guide - Baseball Stats Tracker

This guide will help you deploy your baseball app to Vercel for immediate beta testing.

## 📋 Pre-Deployment Checklist

- [ ] App builds successfully (`npm run build`)
- [ ] Environment variables configured
- [ ] GitHub repository created and pushed
- [ ] Clerk account set up
- [ ] Supabase project created

## 🎯 Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - ready for deployment"

# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/baseball-stats-tracker.git

# Push to GitHub
git push -u origin main
```

### 1.2 Verify Build
```bash
# Test the build locally
npm run build

# Should complete without errors
```

## 🔧 Step 2: Set Up Clerk Authentication

### 2.1 Create Clerk Account
1. Go to [clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application
4. Choose "Next.js" as your framework

### 2.2 Configure Clerk Settings
1. In your Clerk dashboard, go to "API Keys"
2. Copy your **Publishable Key** (starts with `pk_test_`)
3. Copy your **Secret Key** (starts with `sk_test_`)
4. Note these down - you'll need them for Vercel

### 2.3 Configure Sign-in/Sign-up
1. In Clerk dashboard, go to "User & Authentication"
2. Enable "Email" authentication
3. Set up your sign-in and sign-up pages
4. Configure redirect URLs (we'll add Vercel URL later)

## 🗄️ Step 3: Set Up Supabase Database

### 3.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project to be ready (2-3 minutes)

### 3.2 Set Up Database Schema
1. In Supabase dashboard, go to "SQL Editor"
2. Run the migration from `supabase/migrations/20240227_init.sql`
3. This creates the `at_bats` table

### 3.3 Get Supabase Credentials
1. Go to "Settings" → "API"
2. Copy your **Project URL**
3. Copy your **anon public** key

## 🚀 Step 4: Deploy to Vercel

### 4.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with your GitHub account
3. Click "New Project"
4. Import your GitHub repository

### 4.2 Configure Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### 4.3 Add Environment Variables
In Vercel dashboard, go to "Settings" → "Environment Variables" and add:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[your-clerk-key]
CLERK_SECRET_KEY=sk_test_[your-clerk-secret]

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4.4 Deploy
1. Click "Deploy" button
2. Wait for deployment to complete (2-3 minutes)
3. Your app will be live at `https://your-app-name.vercel.app`

## 🔄 Step 5: Update Clerk Redirect URLs

### 5.1 Add Vercel URLs to Clerk
1. Go back to your Clerk dashboard
2. Go to "User & Authentication" → "Email, Phone, Username"
3. Add your Vercel URL to allowed redirect URLs:
   - `https://your-app-name.vercel.app/sign-in`
   - `https://your-app-name.vercel.app/sign-up`
   - `https://your-app-name.vercel.app`

## ✅ Step 6: Test Your Deployment

### 6.1 Test Authentication
1. Visit your Vercel URL
2. Try signing up with a test email
3. Verify you can access the dashboard
4. Test logging out and back in

### 6.2 Test Mobile Features
1. Open on mobile browser
2. Test adding an at-bat
3. Verify bottom navigation works
4. Test PWA installation (add to home screen)

## 🔧 Troubleshooting

### Build Fails
- Check all environment variables are set
- Verify no TypeScript errors: `npm run build`
- Check Vercel build logs for specific errors

### Authentication Issues
- Verify Clerk keys are correct
- Check redirect URLs in Clerk dashboard
- Ensure environment variables are set in Vercel

### Database Issues
- Verify Supabase URL and key are correct
- Check if database migrations ran successfully
- Test database connection in Supabase dashboard

### Mobile Issues
- Test on different mobile browsers
- Check viewport meta tag is working
- Verify PWA manifest (if added)

## 📱 Mobile Optimization

Your app is already optimized for mobile with:
- Responsive design with Tailwind CSS
- Touch-friendly interface
- Mobile-first navigation
- PWA-ready structure

## 🎉 You're Ready!

Your baseball stats tracker is now live and ready for beta testing! Share the Vercel URL with your beta testers.

### Next Steps
1. Share the app URL with beta testers
2. Monitor usage in Vercel analytics
3. Collect feedback and iterate
4. Set up custom domain (optional)

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Clerk authentication logs
3. Check Supabase database logs
4. Review this guide for common solutions
