# OAuth Authentication Setup

## Environment Variables Required

Add these to your `.env` file:

```env
# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple OAuth
APPLE_ID="your-apple-client-id"
APPLE_SECRET="your-apple-client-secret"
```

## Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API** (if not already enabled)
4. **Go to Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. **Configure OAuth consent screen**:
   - Add your domain to authorized domains
   - Add scopes: `email`, `profile`, `openid`
6. **Set up OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. **Copy the Client ID and Client Secret** to your `.env` file

## Apple OAuth Setup

1. **Go to Apple Developer Console**: https://developer.apple.com/
2. **Create an App ID** with Sign In with Apple capability
3. **Create a Service ID**:
   - Identifier: `com.yourdomain.auth`
   - Enable "Sign In with Apple"
   - Add domain: `localhost` (for development)
   - Add redirect URL: `http://localhost:3000/api/auth/callback/apple`
4. **Create a Private Key**:
   - Download the `.p8` file
   - Note the Key ID
5. **Generate Client Secret** using the private key
6. **Add to your `.env` file**:
   - `APPLE_ID`: Your Service ID
   - `APPLE_SECRET`: The generated client secret

## Database Migration

Run the following command to apply the new schema:

```bash
npx prisma db push
```

## Testing OAuth

1. **Start your development server**: `npm run dev`
2. **Visit**: `http://localhost:3000/api/auth/signin`
3. **Test both Google and Apple sign-in buttons**

## Features Added

- ✅ **Google OAuth** - Sign in with Google account
- ✅ **Apple OAuth** - Sign in with Apple ID
- ✅ **Credentials Provider** - Email/password login (existing)
- ✅ **Account Linking** - Users can link multiple OAuth providers
- ✅ **Session Management** - JWT-based sessions
- ✅ **Database Integration** - OAuth accounts stored in database

## Security Notes

- OAuth users don't have passwords (field is optional)
- Each OAuth provider creates a separate account record
- Users can link multiple OAuth providers to the same email
- Sessions are managed via JWT tokens 