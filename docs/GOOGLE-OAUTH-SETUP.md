# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth credentials for the Escalating Reminders application.

---

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## Step-by-Step Instructions

### Step 1: Create a New Project (or Select Existing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **"New Project"** (or select an existing project)
4. Enter project name: `Escalating Reminders` (or your preferred name)
5. Click **"Create"**
6. Wait for the project to be created, then select it from the dropdown

---

### Step 2: Enable Google+ API / OAuth Consent Screen

1. In the left sidebar, navigate to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click on **"Google+ API"** (or **"Google People API"**)
4. Click **"Enable"**

**Note**: For OAuth 2.0, you may also need:
- **Google Identity Services API** (for newer OAuth flows)
- **Google OAuth2 API** (if available)

---

### Step 3: Configure OAuth Consent Screen

1. Navigate to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (unless you have a Google Workspace account)
3. Click **"Create"**

#### Fill in the required information:

- **App name**: `Escalating Reminders` (or your app name)
- **User support email**: Your email address
- **Developer contact information**: Your email address
- **App logo**: (Optional) Upload a logo if you have one

4. Click **"Save and Continue"**

#### Scopes (Step 2):

1. Click **"Add or Remove Scopes"**
2. Select the following scopes:
   - `openid` (automatically added)
   - `email`
   - `profile`
3. Click **"Update"**, then **"Save and Continue"**

#### Test users (Step 3):

1. If your app is in "Testing" mode, add test user emails
2. Add your own email and any test accounts
3. Click **"Save and Continue"**

#### Summary (Step 4):

1. Review the information
2. Click **"Back to Dashboard"**

---

### Step 4: Create OAuth 2.0 Credentials

1. Navigate to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

#### If prompted to configure consent screen:

- You should have already done this in Step 3
- If not, follow Step 3 first

#### Configure OAuth Client:

1. **Application type**: Select **"Web application"**
2. **Name**: `Escalating Reminders Web Client` (or descriptive name)

#### Authorized JavaScript origins:

Add your application URLs:
```
http://localhost:3000
http://localhost:3800
https://your-production-domain.com
```

#### Authorized redirect URIs:

Add your OAuth callback URLs:
```
http://localhost:3000/auth/oauth/callback
http://localhost:3800/auth/oauth/callback
https://your-production-domain.com/auth/oauth/callback
```

**Important**: The redirect URI must match exactly what your application uses. Check your code:
- Frontend callback URL: `/auth/oauth/callback`
- Full URL: `http://localhost:3800/auth/oauth/callback` (for local dev)

4. Click **"Create"**

---

### Step 5: Copy Your Credentials

After creating the OAuth client, you'll see a popup with:

- **Your Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Your Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

**⚠️ Important**: Copy these immediately! The client secret will only be shown once.

---

### Step 6: Configure Your Application

Add these environment variables to your application:

#### For Local Development (`apps/api/.env` or root `.env`):

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# OAuth Redirect Base URL (for generating callback URLs)
OAUTH_REDIRECT_BASE_URL=http://localhost:3800
```

#### For Production:

```bash
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
OAUTH_REDIRECT_BASE_URL=https://your-production-domain.com
```

---

## Testing Your Setup

### 1. Verify Environment Variables

Make sure your API server can access these variables:

```bash
cd apps/api
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

### 2. Test OAuth Flow

1. Start your development servers:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3800/login`

3. Click **"Continue with Google"**

4. You should be redirected to Google's OAuth consent screen

5. After authorizing, you should be redirected back to your app

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI in your request doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Check the exact redirect URI your app is using
2. Go to Google Cloud Console → Credentials → Your OAuth Client
3. Add the exact redirect URI to "Authorized redirect URIs"
4. Make sure there are no trailing slashes or extra characters

### Error: "invalid_client"

**Problem**: Client ID or Client Secret is incorrect.

**Solution**:
1. Verify your environment variables are set correctly
2. Check for extra spaces or quotes in your `.env` file
3. Restart your API server after changing environment variables

### Error: "access_denied"

**Problem**: User denied access or app is in testing mode and user isn't a test user.

**Solution**:
1. Add the user's email to "Test users" in OAuth consent screen
2. Or publish your app (if ready for production)

### OAuth Button Doesn't Appear

**Problem**: The OAuth button might not be visible if there's a JavaScript error.

**Solution**:
1. Check browser console for errors
2. Verify the API client is configured correctly
3. Check network tab for failed API calls

---

## Security Best Practices

1. **Never commit credentials to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables or secrets management

2. **Use different credentials for dev/staging/production**
   - Create separate OAuth clients for each environment
   - Use different redirect URIs

3. **Rotate secrets regularly**
   - Regenerate client secrets periodically
   - Revoke old credentials when rotating

4. **Limit redirect URIs**
   - Only add URIs you actually use
   - Remove unused redirect URIs

5. **Monitor OAuth usage**
   - Check Google Cloud Console for unusual activity
   - Set up alerts for authentication failures

---

## Production Checklist

Before going to production:

- [ ] Create a separate OAuth client for production
- [ ] Update OAuth consent screen to "Published" status
- [ ] Add production redirect URIs
- [ ] Set up environment variables in your hosting platform
- [ ] Test OAuth flow in production environment
- [ ] Set up monitoring and alerts
- [ ] Document your OAuth client IDs for team reference

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) (for testing)

---

## Quick Reference: Environment Variables

```bash
# Required for OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_BASE_URL=http://localhost:3800  # or your production URL
```

---

*Last updated: December 2025*
