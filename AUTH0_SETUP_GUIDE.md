# Auth0 Integration Setup Guide for Clarify

This guide walks you through setting up Auth0 authentication for your already-deployed Clarify application.

## 📋 Prerequisites

- Active Auth0 account (sign up at https://auth0.com)
- AWS CLI configured with your credentials
- Access to your Amplify Hosting console
- Node.js and npm installed

## 🚀 Step-by-Step Setup

### Step 1: Create Auth0 Application

1. **Log into Auth0 Dashboard**: Go to https://manage.auth0.com/
2. **Create Application**:
   - Click **Applications** in the left sidebar
   - Click **Create Application**
   - Name: `Clarify`
   - Type: Select **Regular Web Applications**
   - Click **Create**

3. **Save Credentials**: On the Settings tab, copy these values:
   - **Domain** (e.g., `yourapp.auth0.com`)
   - **Client ID**
   - **Client Secret**

> ⚠️ **Important**: Keep this tab open - you'll need to update callback URLs later.

---

### Step 2: Update Local Environment Variables

1. **Edit `.env` file** in your project root:

```bash
# Replace YOUR_AUTH0_DOMAIN with your actual Auth0 domain (e.g., yourapp.auth0.com)
ISSUER_URL=https://YOUR_AUTH0_DOMAIN
CALLBACK_URL=http://localhost:3000
LOGOUT_URL=http://localhost:3000
```

2. **For production**, you'll update these in Amplify Hosting later with your live domain.

---

### Step 3: Set AWS Secrets

These commands store your Auth0 credentials securely in AWS Systems Manager Parameter Store:

```bash
# Set Client ID
npx ampx sandbox secret set AUTH0_CLIENT_ID
# When prompted, paste your Auth0 Client ID

# Set Client Secret
npx ampx sandbox secret set AUTH0_CLIENT_SECRET
# When prompted, paste your Auth0 Client Secret
```

You should see confirmation messages like:
```
✅ Successfully created version 1 of secret AUTH0_CLIENT_ID
✅ Successfully created version 1 of secret AUTH0_CLIENT_SECRET
```

---

### Step 4: Install Dependencies

Install the new packages required for authentication:

```bash
npm install
```

This installs:
- `dotenv` - Environment variable management
- `react-intl` - Internationalization for auth messages

---

### Step 5: Deploy Amplify Backend

Run the sandbox to deploy your updated authentication configuration:

```bash
npx ampx sandbox
```

**First-time setup:**
- You'll be asked to sign in to AWS Console
- Click "Initialize setup now" in Amplify console
- Bootstrap process takes 5-10 minutes

**After bootstrap:**
- Sandbox deploys your backend resources
- An `amplify_outputs.json` file will be generated
- Look for the **Cognito Domain** in the output (looks like: `clarify-xxxxx.auth.us-east-1.amazoncognito.com`)

> 📝 **Save the Cognito Domain** - you'll need it in the next step!

---

### Step 6: Configure Auth0 Callback URLs

Now that you have the Cognito domain, configure Auth0:

1. **Go back to your Auth0 Application** (Settings tab)
2. **Scroll to Application URIs**
3. **Add Allowed Callback URLs**:
   ```
   https://YOUR_COGNITO_DOMAIN/oauth2/idpresponse
   ```
   Replace `YOUR_COGNITO_DOMAIN` with the Cognito domain from Step 5.

4. **Add Allowed Logout URLs**:
   ```
   http://localhost:3000
   ```

5. **Click Save Changes** at the bottom

---

### Step 7: Test Locally

Start your development server:

```bash
npm run dev
```

**Test the flow:**
1. Open http://localhost:3000
2. You should be redirected to `/auth`
3. Click "Sign in with Auth0"
4. Complete Auth0 login
5. You'll be redirected back and authenticated

---

### Step 8: Deploy to Amplify Hosting

Your code is ready! Now push to GitHub and configure production:

#### A. Push Changes to GitHub

```bash
git add .
git commit -m "Add Auth0 authentication"
git push origin deployment-testing
```

#### B. Configure Amplify Hosting Environment Variables

1. **Go to AWS Amplify Console**
2. **Select your Clarify app**
3. **Navigate to**: Hosting > Environment variables
4. **Add these variables**:

```
ISSUER_URL = https://YOUR_AUTH0_DOMAIN
CALLBACK_URL = https://YOUR_BRANCH.YOUR_APP_ID.amplifyapp.com
LOGOUT_URL = https://YOUR_BRANCH.YOUR_APP_ID.amplifyapp.com
```

Replace:
- `YOUR_AUTH0_DOMAIN` with your Auth0 domain
- `YOUR_BRANCH` with your git branch (e.g., `deployment-testing`)
- `YOUR_APP_ID` with your Amplify app ID (find in Overview section)

5. **Save**

#### C. Add Secrets in Amplify Hosting

1. **Navigate to**: Hosting > Secrets
2. **Click "Manage Secrets"**
3. **Add both secrets**:
   - Key: `AUTH0_CLIENT_ID` → Value: Your Auth0 Client ID
   - Key: `AUTH0_CLIENT_SECRET` → Value: Your Auth0 Client Secret
4. **Save**

#### D. Update Auth0 Production Callback URLs

1. **Go back to Auth0 Application Settings**
2. **Update Allowed Callback URLs** to include both local and production:
   ```
   https://YOUR_COGNITO_DOMAIN/oauth2/idpresponse,
   http://localhost:3000
   ```
3. **Update Allowed Logout URLs**:
   ```
   https://YOUR_BRANCH.YOUR_APP_ID.amplifyapp.com,
   http://localhost:3000
   ```
4. **Save Changes**

#### E. Trigger Redeploy

If Amplify hasn't auto-deployed yet:
1. Go to Amplify Console
2. Click **Redeploy this version**

---

## 🎉 You're Done!

Your authentication is now live! Users can:
- ✅ Sign in with Auth0 (email/password or social login)
- ✅ Access protected routes when authenticated
- ✅ Sign out securely

---

## 🧪 Testing Checklist

- [ ] Local development: Can sign in via http://localhost:3000
- [ ] Local development: Can sign out and sign back in
- [ ] Production: Can sign in via your Amplify domain
- [ ] Production: Protected routes redirect to `/auth` when not authenticated
- [ ] Production: Authenticated users can access dashboard

---

## 🔧 Troubleshooting

### Error: "Cannot find module '@/amplify_outputs.json'"
**Solution**: Run `npx ampx sandbox` to generate the file.

### Error: "Agora App ID not configured"
**Solution**: Ensure all environment variables are set in Amplify Hosting.

### Auth0 redirect not working
**Solution**: 
1. Verify Cognito domain is correctly added to Auth0 callback URLs
2. Check that ISSUER_URL includes `https://` prefix
3. Ensure secrets are saved in Amplify Hosting

### Users can't access protected routes
**Solution**: Check browser console for errors. Ensure `amplify_outputs.json` is deployed.

---

## 📚 Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [AWS Amplify Authentication](https://docs.amplify.aws/gen2/build-a-backend/auth/)
- [Amazon Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)

---

## 🔐 Security Notes

- Never commit `.env` files to Git (already in `.gitignore`)
- Rotate Auth0 Client Secret periodically
- Use HTTPS in production (Amplify provides this automatically)
- Enable MFA in Auth0 for additional security

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review AWS Amplify console logs
3. Check browser console for client-side errors
4. Verify all environment variables and secrets are correctly set
