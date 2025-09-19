# Supabase Setup Guide

## Environment Variables

Add these environment variables to your project:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://kgqjsnzunoizxyvkanke.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Getting Your Supabase Keys

1. **Go to your Supabase dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project**: `kgqjsnzunoizxyvkanke`
3. **Navigate to**: Settings → API
4. **Copy these keys**:
   - **URL**: `https://kgqjsnzunoizxyvkanke.supabase.co`
   - **anon/public key**: This is your `VITE_SUPABASE_ANON_KEY`

## Configuring Google OAuth

### Step 1: Configure in Supabase
1. **Go to**: Authentication → Providers in your Supabase dashboard
2. **Find Google** and toggle it ON
3. **Enter your Google OAuth credentials**:
   - **Client ID**: `477388327398-g2b7s49pronvli3vroh227mi8fke5jda.apps.googleusercontent.com`
   - **Client Secret**: Your Google Client Secret from Google Cloud Console

### Step 2: Configure Redirect URLs
In your Supabase Auth settings, add these redirect URLs:
- `http://localhost:5000/auth/callback` (for development)
- `https://your-domain.replit.dev/auth/callback` (for production)

## Testing the Integration

1. **Set up environment variables** in your Replit project
2. **Visit your app** and click "Continue with Google"
3. **Complete the Google sign-in flow**
4. **You should be redirected back to your app** and logged in

## Features Included

- ✅ Google OAuth sign-in with Supabase
- ✅ Dual authentication (Google + Replit Auth)
- ✅ Automatic session management
- ✅ Secure redirect handling
- ✅ User state persistence

## Architecture

- **Primary Auth**: Google OAuth via Supabase (recommended for new users)
- **Fallback Auth**: Replit Auth (for existing users or backup)
- **Session Management**: Handled automatically by Supabase
- **Redirect Flow**: `/auth/callback` → authenticated app state