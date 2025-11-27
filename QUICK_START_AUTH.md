# Clarify Auth0 Setup - Quick Start

## 🚦 Current Status

You have Auth0 authentication **code ready** but need to complete the setup steps below.

## ⚠️ Build Error Fix

The build errors you're seeing are **expected** because `amplify_outputs.json` doesn't exist yet. This file is generated when you run the Amplify sandbox.

## 📋 Complete These Steps in Order

### Step 1: Install Dependencies ✅

```bash
npm install
```

This installs `react-intl` and `dotenv` packages.

---

### Step 2: Set Up Auth0 Application

1. Go to https://auth0.com/ and sign in
2. Click **Applications** → **Create Application**
3. Name: `Clarify`
4. Type: **Regular Web Applications**
5. Click **Create**

**Save these values:**
- Domain (e.g., `yourapp.auth0.com`)
- Client ID
- Client Secret

---

### Step 3: Update Environment Variables

Edit `.env` file and replace `YOUR_AUTH0_DOMAIN`:

```bash
ISSUER_URL=https://yourapp.auth0.com
CALLBACK_URL=http://localhost:3000
LOGOUT_URL=http://localhost:3000
```

---

### Step 4: Set AWS Secrets

```bash
npx ampx sandbox secret set AUTH0_CLIENT_ID
# Paste your Auth0 Client ID when prompted

npx ampx sandbox secret set AUTH0_CLIENT_SECRET
# Paste your Auth0 Client Secret when prompted
```

---

### Step 5: Deploy Amplify Backend

```bash
npx ampx sandbox
```

**This will:**
- Generate `amplify_outputs.json` (fixes the build errors!)
- Deploy authentication backend to AWS
- Set up Cognito user pool with Auth0 federation

**Note:** First time will take 5-10 minutes for AWS bootstrap.

---

### Step 6: Get Cognito Domain

After `npx ampx sandbox` completes, look for the Cognito domain in the output.

It looks like: `clarify-xxxxx.auth.us-east-1.amazoncognito.com`

**Save this domain!** You need it for Step 7.

---

### Step 7: Configure Auth0 Callback URLs

1. Go back to your Auth0 Application (Settings tab)
2. Find **Allowed Callback URLs**
3. Add: `https://YOUR_COGNITO_DOMAIN/oauth2/idpresponse`
4. Find **Allowed Logout URLs**
5. Add: `http://localhost:3000`
6. Click **Save Changes**

---

### Step 8: Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and you should:
1. Be redirected to `/auth`
2. See the login page
3. Click "Sign in with Auth0"
4. Complete Auth0 login
5. Return to the app authenticated!

---

## ✅ Success Checklist

- [ ] `npm install` completed
- [ ] Auth0 application created
- [ ] `.env` file updated with Auth0 domain
- [ ] AWS secrets set (AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET)
- [ ] `npx ampx sandbox` completed successfully
- [ ] `amplify_outputs.json` file exists
- [ ] Cognito domain added to Auth0 callback URLs
- [ ] Local testing successful

---

## 🚀 Deploy to Production

Once local testing works, follow these steps:

### 1. Push to GitHub

```bash
git add .
git commit -m "Add Auth0 authentication"
git push origin deployment-testing
```

### 2. Configure Amplify Hosting

In AWS Amplify Console:

**Environment Variables:**
- `ISSUER_URL` = `https://yourapp.auth0.com`
- `CALLBACK_URL` = `https://deployment-testing.YOURAPPID.amplifyapp.com`
- `LOGOUT_URL` = `https://deployment-testing.YOURAPPID.amplifyapp.com`

**Secrets:**
- `AUTH0_CLIENT_ID` = Your Auth0 Client ID
- `AUTH0_CLIENT_SECRET` = Your Auth0 Client Secret

### 3. Update Auth0 Callback URLs

Add your production URLs to Auth0:
- Callback: `https://YOUR_COGNITO_DOMAIN/oauth2/idpresponse`
- Logout: `https://deployment-testing.YOURAPPID.amplifyapp.com`

---

## 🐛 Troubleshooting

### "amplify_outputs.json not found"
**Solution:** Run `npx ampx sandbox` to generate it

### "Invalid callback URL" from Auth0
**Solution:** Verify Cognito domain is added to Auth0 settings (with https://)

### "Cannot find module 'react-intl'"
**Solution:** Run `npm install`

### Redirects not working
**Solution:** Check browser console for errors, verify all URLs match exactly

---

## 📖 Full Documentation

- **Detailed Setup Guide:** `AUTH0_SETUP_GUIDE.md`
- **Implementation Details:** `AUTH0_IMPLEMENTATION.md`

---

## 🆘 Quick Help

**Command failing?** Make sure you have:
- AWS CLI configured (`aws configure`)
- Node.js v18+ installed
- npm v9+ installed

**Still stuck?** Check the browser console and AWS Amplify console logs for specific error messages.
