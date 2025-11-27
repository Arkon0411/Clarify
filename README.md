# Clarify - AI Meeting Task Manager

AWS Amplify Next.js application with Agora video calling for AI-powered meeting task management.

## Overview

Clarify is a full-stack meeting task management system that combines:
- **AWS Amplify Gen 2** for serverless backend (authentication, GraphQL API, DynamoDB)
- **Next.js 16** with React 19 for modern frontend
- **Agora RTC** for real-time video calling with AI conversational agents
- **shadcn/ui** component library with custom Granola design system

## Features

### Core Features
- 📊 **Manager Dashboard** - Team activity, task overview, and meeting management
- ✅ **Task Management** - Kanban board with drag-and-drop, AI confidence levels
- 👥 **Meeting Management** - Schedule, join, and review meetings
- 📹 **Live Video Calls** - Agora-powered video meetings with AI agent support
- 🤖 **AI Task Detection** - Automatically extract tasks from meeting conversations
- 🔍 **Task Review** - Approve/reject AI-detected tasks with confidence scores

### AWS Backend
- 🔐 **Authentication** - Amazon Cognito user management
- 📡 **GraphQL API** - AWS AppSync for real-time data sync
- 💾 **Database** - Amazon DynamoDB for scalable storage
- 🚀 **Serverless** - Fully managed AWS infrastructure

### Agora Video Integration (Ready)
- 📹 Real-time video/audio communication
- 🤖 AI conversational agents (LLM, TTS, Avatar)
- 📝 Complete integration documentation in `docs/agora/`

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```env
# Agora Configuration (for video calling)
AGORA_APPID=your_agora_appid
AGORA_TOKEN=your_agora_token
AGORA_REST_KEY=your_agora_restful_key
AGORA_REST_SECRET=your_agora_restful_secret

# Optional: AI Services
GROQ_KEY=your_groq_key
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_minimax_groupid
AVATAR_AKOOL_KEY=your_akool_key
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Deploy to AWS Amplify

```bash
npx ampx sandbox    # Start backend sandbox
npm run build       # Build frontend
```

Connect your GitHub repository in AWS Amplify Console for production deployment.

## Agora Video Integration

Ready-to-implement video calling with comprehensive guides:

1. **Quick Start**: `docs/agora/QUICK_START.md` (5-minute setup)
2. **Full Guide**: `docs/agora/NEXTJS_INTEGRATION_GUIDE.md`
3. **Code Examples**: `docs/agora/examples/`

## Project Structure

```
app/              # Next.js pages
  ├── meetings/live/  # Video call page (ready for Agora)
  ├── tasks/          # Task management
  └── review/         # AI task review
components/       # React components (69 files)
  ├── ui/             # shadcn/ui components
  └── *.tsx           # Custom components
lib/              # Utilities, types, mock data
hooks/            # Custom React hooks
docs/             # Integration documentation
amplify/          # AWS backend configuration
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Backend**: AWS Amplify Gen 2, DynamoDB, AppSync
- **Video**: Agora RTC SDK
- **State**: Zustand, React Hook Form

## Available Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm start         # Production server
npm run lint      # Lint code
```

## Deploying to AWS

1. Push to GitHub
2. Connect repository in [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. Configure environment variables in Amplify Console
4. Amplify automatically builds and deploys

For detailed instructions, see the [Amplify deployment docs](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/#deploy-a-fullstack-app-to-aws).

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.