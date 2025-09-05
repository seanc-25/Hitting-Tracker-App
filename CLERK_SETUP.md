# Clerk Authentication Setup

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[your-key-here]
CLERK_SECRET_KEY=sk_test_[your-key-here]

# Supabase (for data storage)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Getting Clerk Keys

1. Go to https://clerk.com/
2. Create a new application
3. Copy the Publishable Key and Secret Key
4. Add them to your `.env.local` file

## What's Been Changed

- ✅ Removed Google OAuth code
- ✅ Removed Supabase auth code
- ✅ Added Clerk authentication
- ✅ Updated login/signup pages to redirect to Clerk
- ✅ Updated main dashboard to use Clerk user data
- ✅ Created Clerk middleware for route protection

## Next Steps

1. Set up your Clerk account and get your keys
2. Add the keys to `.env.local`
3. Test the authentication flow
4. Update any remaining components that use the old auth system

## Notes

- The app now uses Clerk for authentication
- Supabase is still used for data storage
- All existing app pages and functionality are preserved
- Mobile performance is maintained for beta testing
