# Manual Auth0 Setup Guide (No CLI Required)

This guide shows you how to set up Auth0 authentication using only the AWS Console and Auth0 Dashboard - **no CLI commands needed**.

## 📋 Prerequisites

- AWS Account with console access
- Auth0 account (sign up at https://auth0.com)
- Your Clarify app code deployed on AWS Amplify Hosting

---

## Part 1: Create Auth0 Application

### Step 1: Set Up Auth0

1. Go to https://manage.auth0.com/
2. Click **Applications** → **Create Application**
3. Name: `Clarify`
4. Type: **Regular Web Applications**
5. Click **Create**

### Step 2: Get Auth0 Credentials

On the Settings tab, copy and save:
- **Domain** (e.g., `dev-abc123.us.auth0.com`)
- **Client ID** (e.g., `abc123xyz789`)
- **Client Secret** (e.g., `xyz789abc123...`)

**Keep this tab open** - we'll update it later.

---

## Part 2: Create AWS Resources Manually

### Step 3: Create Cognito User Pool

1. **Go to AWS Console** → Search for **Amazon Cognito** in the top search bar
2. Click the orange **Create user pool** button

---

**Define your application:**

1. **Application type**: Select **Traditional web application**
   
2. **Name your application**: Enter `clarify-web-app`

---

**Configure options:**

3. **Options for sign-in identifiers**:
   - ✅ Check **Email**
   - ⬜ Uncheck **Phone number**
   - ⬜ Uncheck **Username**
   
4. **Self-registration**:
   - ✅ Check **Enable self-registration**

5. **Required attributes for sign-up**:
   - This auto-selects **email** since we chose email as sign-in identifier
   - ✅ Ensure **email** is checked

6. **Add a return URL**:
   - **Return URL**: Enter `http://localhost:3000`
   - Click the small **Add return URL** link to confirm

7. Click the orange **Create** button at the bottom

Wait 30-60 seconds for creation to complete.

---

**After Creation - Save These Values:**

You'll be taken to the User Pool Overview page.

✅ **From the Overview tab:**
- **User Pool ID** (e.g., `us-east-1_abc123xyz`) - Copy this!
- **AWS Region** (e.g., `us-east-1`) - Note this!

✅ **Get the App Client ID and Secret:**
1. Click on the **App integration** tab at the top
2. Scroll down to **App clients and analytics** section
3. Click on your app client name (clarify-web-app)
4. You'll see:
   - **Client ID** (e.g., `1a2b3c4d5e6f7g8h9i0j1k`) - Copy this!
   - **Client secret** - Click **Show** to reveal it, then copy it!

---

### Step 4: Add Auth0 as Federated Identity Provider

Now we'll connect Auth0 to your Cognito User Pool.

1. **Stay in your User Pool**, click the **Sign-in experience** tab at the top

2. Scroll down to **Federated sign-in** section

3. Click **Add identity provider**

4. On the "Add identity provider" page, select **OpenID Connect**

5. **Fill in the provider details:**

```
Provider name: Auth0

Client ID: [Paste your Auth0 Client ID from Step 2]

Client secret: [Paste your Auth0 Client Secret from Step 2]

Authorized scopes: openid profile email

Issuer URL: https://[YOUR_AUTH0_DOMAIN]
```

**Example Issuer URL:** `https://dev-abc123.us.auth0.com`

> ⚠️ **Important**: The Issuer URL must include `https://` and should NOT have a trailing slash

6. **Attribute mapping** (scroll down to "Map attributes between your OpenID Connect provider and your user pool"):
   
   You'll see a table with columns: "User pool attribute", "OpenID Connect attribute", "Attribute is required"
   
   The `email` attribute should already be there (since it's required). Fill it in:
   - **User pool attribute**: `email` (already selected/shown)
   - **OpenID Connect attribute**: Type `email`
   - **Attribute is required**: ✅ (already checked)
   
   To add name mapping (optional but recommended):
   - Click **Add attribute** button
   - **User pool attribute**: Select `name` from dropdown
   - **OpenID Connect attribute**: Type `name`
   - Leave "Attribute is required" unchecked

7. Click **Add identity provider** button at the bottom

---

### Step 5: Enable Auth0 in Your App Client

Now we need to tell your app client to use Auth0 for sign-in.

1. In the **left sidebar**, look under the **Applications** section

2. Click on **App clients**

3. You'll see your app client listed (**clarifyUserPool**). Click on its name.

4. On the app client details page, look for the **Hosted UI** section (scroll down if needed)

5. Click the **Edit** button in the **Hosted UI** section

   > 💡 **Important**: Make sure you're clicking "Edit" for **Hosted UI settings** (identity providers, OAuth settings), NOT "Edit Hosted UI customization" (logos and CSS). If you see options for uploading logos/CSS, you're on the wrong page - go back and look for the Hosted UI section higher up on the page.

6. In the Hosted UI settings:

   **Identity providers:**
   - You'll see checkboxes for different providers
   - ✅ Check **Auth0** (it should appear now since you added it in Step 4)
   - You can uncheck **Cognito user pool** if you only want Auth0 login, or leave both checked

   **OAuth 2.0 grant types:**
   - ✅ Check **Authorization code grant**
   - ✅ Check **Implicit grant** (optional, but recommended)

7. Under **OpenID Connect scopes**:
   - ✅ Check **openid**
   - ✅ Check **profile**
   - ✅ Check **email**

8. Click **Save changes** at the bottom



### Step 6: Create Cognito Domain

The new AWS Console creates the domain automatically when you configure the app client. Let's verify it was created:

1. In the **left sidebar**, navigate to **Applications** → **App clients**

2. Click on your app client (**clarifyUserPool**)

3. Look for a section that shows the **Cognito domain** or **Hosted UI URL**
   
   - It may have been auto-generated when you created the user pool via Quick Setup
   - Look for something like: `clarifyuserpool.auth.us-east-1.amazoncognito.com`

4. **If you see a domain**: Copy and save it! Skip to Step 7.

5. **If you DON'T see a domain**: 
   - Go back to **Branding** → **Domain** in the left sidebar
   - Since there's no "Cognito domain" section, you'll need to use **Custom domain**
   - OR continue without a domain for now (we can create it later if needed)

> 💡 **Note**: In the new Quick Setup flow, a domain is often created automatically. Check your app client details first before trying to create a new one.

### Step 7: Collect User Pool Details

Save these values from your user pool (you'll need them later):

- **User Pool ID**: 
  - Left sidebar → **Overview**
  - Copy the User Pool ID (e.g., `us-east-1_abc123xyz`)

- **App Client ID**: 
  - Left sidebar → **Applications** → **App clients**
  - Click on your app client name
  - Copy the Client ID

- **Cognito Domain**: From Step 6 (e.g., `clarify-auth-123.auth.us-east-1.amazoncognito.com`)

---

## Part 3: Create AppSync API & DynamoDB

### Step 8: Create DynamoDB Table

1. Go to **AWS Console** → **DynamoDB**
2. Click **Create table**

**Configure:**
```
Table name: Todo-[random-id]
Partition key: id (String)
Sort key: (leave empty)
```

3. Click **Create table**
4. **Save the table name and ARN**

### Step 9: Create AppSync API

1. Go to **AWS Console** → **AWS AppSync**
2. Click **Create API**
3. Choose **Build from scratch**
4. API name: `clarify-api`
5. Click **Create**

### Step 10: Configure AppSync Schema

1. In your AppSync API, go to **Schema**
2. Replace the schema with:

```graphql
type Todo @aws_cognito_user_pools {
  id: ID!
  content: String
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}

type Query {
  getTodo(id: ID!): Todo @aws_cognito_user_pools
  listTodos: [Todo] @aws_cognito_user_pools
}

type Mutation {
  createTodo(input: CreateTodoInput!): Todo @aws_cognito_user_pools
  updateTodo(input: UpdateTodoInput!): Todo @aws_cognito_user_pools
  deleteTodo(id: ID!): Todo @aws_cognito_user_pools
}

input CreateTodoInput {
  content: String
}

input UpdateTodoInput {
  id: ID!
  content: String
}

type Subscription {
  onCreateTodo: Todo @aws_subscribe(mutations: ["createTodo"])
  onUpdateTodo: Todo @aws_subscribe(mutations: ["updateTodo"])
  onDeleteTodo: Todo @aws_subscribe(mutations: ["deleteTodo"])
}
```

3. Click **Save Schema**

### Step 11: Connect DynamoDB to AppSync

1. In AppSync, go to **Data sources**
2. Click **Create data source**
3. **Data source name**: `TodoTable`
4. **Data source type**: Amazon DynamoDB table
5. **Region**: (your region)
6. **Table name**: Select the table you created in Step 8
7. **Create or use existing role**: Create new role
8. Click **Create**

### Step 12: Create Resolvers

The new AppSync console has changed! You now need to configure resolvers differently:

**For each query/mutation (listTodos, createTodo, deleteTodo):**

1. Go to **Schema** → Find the field (e.g., `listTodos`) → Click **Attach** or **Add resolver**

2. On the "Attach resolver" page:
   - **Resolver type**: Select **Unit resolver**
   - **Resolver runtime**: Select **Velocity Template Language (VTL)**
   - **Data source name**: Select **TodoTable** (the data source you created in Step 11)

3. Click **Create** or **Save**

> ⚠️ **Important**: The new interface uses VTL runtime by default. The resolvers will work with DynamoDB automatically based on your GraphQL schema types. You don't need to manually enter mapping templates in the new console - AppSync auto-generates them!

**If you want to use the old mapping templates:**

Only if the console shows fields for "Request mapping template" and "Response mapping template", use these:

**listTodos templates:**
- Request: `{"version": "2017-02-28", "operation": "Scan"}`
- Response: `$util.toJson($ctx.result.items)`

**createTodo templates:**
- Request: 
```json
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {"id": $util.dynamodb.toDynamoDBJson($util.autoId())},
  "attributeValues": {
    "content": $util.dynamodb.toDynamoDBJson($ctx.args.input.content),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}
```
- Response: `$util.toJson($ctx.result)`

**deleteTodo templates:**
- Request: `{"version": "2017-02-28", "operation": "DeleteItem", "key": {"id": $util.dynamodb.toDynamoDBJson($ctx.args.id)}}`
- Response: `$util.toJson($ctx.result)`

### Step 13: Configure AppSync Authorization

1. In AppSync API, go to **Settings**
2. **Default authorization mode**: Amazon Cognito User Pool
3. **User pool**: Select your user pool from Step 3
4. Click **Save**

---

## Part 4: Update Auth0 Configuration

### Step 14: Add Cognito Callback to Auth0

1. Go back to **Auth0 Dashboard**
2. Open your Clarify application
3. Go to **Settings** tab
4. **Allowed Callback URLs**, add:
```
https://[YOUR_COGNITO_DOMAIN]/oauth2/idpresponse
```

Example: `https://clarify-auth-123.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`

5. **Allowed Logout URLs**, add:
```
http://localhost:3000
https://[YOUR_AMPLIFY_DOMAIN]
```

6. Click **Save Changes**

---

## Part 5: Configure Your Application

### Step 15: Create amplify_outputs.json

Create `amplify_outputs.json` in your project root:

```json
{
  "auth": {
    "user_pool_id": "us-east-1_abc123",
    "aws_region": "us-east-1",
    "user_pool_client_id": "your-app-client-id",
    "identity_pool_id": "",
    "mfa_methods": [],
    "standard_required_attributes": ["email"],
    "username_attributes": ["email"],
    "user_verification_types": ["email"],
    "mfa_configuration": "OPTIONAL",
    "password_policy": {
      "min_length": 8,
      "require_lowercase": true,
      "require_numbers": true,
      "require_symbols": true,
      "require_uppercase": true
    },
    "oauth": {
      "identity_providers": ["Auth0"],
      "domain": "clarify-auth-123.auth.us-east-1.amazoncognito.com",
      "scopes": ["openid", "profile", "email"],
      "redirect_sign_in_uri": ["http://localhost:3000"],
      "redirect_sign_out_uri": ["http://localhost:3000"],
      "response_type": "code"
    }
  },
  "data": {
    "url": "https://your-api-id.appsync-api.us-east-1.amazonaws.com/graphql",
    "aws_region": "us-east-1",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS",
    "authorization_types": ["AMAZON_COGNITO_USER_POOLS"],
    "api_key": ""
  },
  "version": "1"
}
```

**Replace these values:**
- `user_pool_id`: From Step 7
- `user_pool_client_id`: From Step 7
- `oauth.domain`: From Step 6 (without https://)
- `data.url`: Your AppSync API URL (found in AppSync Settings)

### Step 16: Update Environment Variables

Update your `.env` file:

```bash
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_abc123
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-app-client-id
NEXT_PUBLIC_COGNITO_DOMAIN=clarify-auth-123.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_APPSYNC_URL=https://your-api-id.appsync-api.us-east-1.amazonaws.com/graphql

# Auth0
ISSUER_URL=https://dev-abc123.us.auth0.com
CALLBACK_URL=http://localhost:3000
LOGOUT_URL=http://localhost:3000
```

### Step 17: Configure Amplify Hosting Environment Variables

1. Go to **AWS Amplify Console**
2. Select your Clarify app
3. Go to **Environment variables**
4. Add:

```
ISSUER_URL = https://[YOUR_AUTH0_DOMAIN]
CALLBACK_URL = https://[YOUR_AMPLIFY_DOMAIN]
LOGOUT_URL = https://[YOUR_AMPLIFY_DOMAIN]
NEXT_PUBLIC_AWS_REGION = us-east-1
NEXT_PUBLIC_USER_POOL_ID = [YOUR_USER_POOL_ID]
NEXT_PUBLIC_USER_POOL_CLIENT_ID = [YOUR_APP_CLIENT_ID]
NEXT_PUBLIC_COGNITO_DOMAIN = [YOUR_COGNITO_DOMAIN]
NEXT_PUBLIC_APPSYNC_URL = [YOUR_APPSYNC_URL]
```

---

## Part 6: Test Your Setup

### Step 18: Test Locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000:
1. Should redirect to `/auth`
2. Click "Sign in with Auth0"
3. Complete Auth0 login
4. Should redirect back authenticated

### Step 19: Deploy to Production

```bash
git add .
git commit -m "Add Auth0 authentication"
git push origin deployment-testing
```

Amplify will automatically deploy.

---

## 🎉 Done!

Your Auth0 authentication is now fully configured without using any CLI commands!

## 🔧 Troubleshooting

### Can't sign in?
- Check Cognito domain is added to Auth0 callbacks (with `https://` and `/oauth2/idpresponse`)
- Verify all IDs match in `amplify_outputs.json`

### AppSync errors?
- Check authorization mode is set to Cognito User Pool
- Verify resolvers are attached to all queries/mutations

### Environment variables not working?
- Redeploy in Amplify Console after adding variables
- Check variable names have `NEXT_PUBLIC_` prefix for client-side access

---

## 📚 What You Created

✅ Cognito User Pool with Auth0 federation
✅ AppSync GraphQL API with DynamoDB
✅ Configured Auth0 application
✅ Manual `amplify_outputs.json` configuration
✅ Environment variables for all environments

No CLI needed! 🎉
