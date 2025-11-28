# Agora Conversational AI Persona Setup Guide

This guide explains how to set up the Agora Conversational AI persona that automatically joins your meetings.

## Overview

The AI persona is an intelligent meeting assistant that:
- Automatically joins when someone enters a meeting
- Listens to conversations and can respond
- Provides helpful meeting insights
- Uses voice-to-voice interaction

## Required Environment Variables

Add these to your `.env.local` file:

### Agora Credentials (Required)
```env
# Agora App ID (you already have this)
AGORA_APP_ID=your_agora_app_id
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

# Agora REST API Key and Secret (for Conversational AI API)
# Get these from: https://console.agora.io/
AGORA_REST_KEY=your_rest_api_key
AGORA_REST_SECRET=your_rest_api_secret
```

### LLM Configuration (Required)
```env
# Groq API Key
GROQ_KEY=your_groq_key
```

### TTS Configuration (Required for voice)
```env
# Minimax TTS credentials
TTS_MINIMAX_GROUPID=your_minimax_groupid
TTS_MINIMAX_KEY=your_minimax_key
```

### Avatar Configuration (Optional)
```env
# Akool Avatar API Key
AVATAR_AKOOL_KEY=your_akool_key
```

## How to Get Credentials

### 1. Agora REST API Key & Secret
1. Go to [Agora Console](https://console.agora.io/)
2. Navigate to your project
3. Go to "Project Management" → "Keys"
4. Copy the **Customer ID** (REST API Key) and **Customer Secret** (REST API Secret)
5. Use these as `AGORA_REST_KEY` and `AGORA_REST_SECRET`

### 2. Groq API Key
- Sign up at [console.groq.com](https://console.groq.com/)
- Get your API key from the dashboard
- Use as `GROQ_KEY`

### 3. Minimax TTS
1. Sign up at [Minimax](https://www.minimax.com/)
2. Get your Group ID and API Key from the dashboard
3. Use as `TTS_MINIMAX_GROUPID` and `TTS_MINIMAX_KEY`

### 4. Akool Avatar (Optional)
1. Sign up at [Akool](https://www.akool.com/)
2. Get your API key from the dashboard
3. Use as `AVATAR_AKOOL_KEY`

## Features

### Automatic Join
The AI agent automatically joins when:
- A user successfully joins the meeting
- Tracks are published

### AI Agent UID
- The AI agent uses UID `10001` (configurable in `components/meeting-live-view.tsx`)
- Make sure this UID doesn't conflict with user UIDs (users use 0-10000)

### Configuration Options

You can customize the AI persona in `hooks/use-agora-convo-ai.ts`:

- **System Message**: Change the AI's personality and behavior
- **Greeting Message**: What the AI says when joining
- **Voice Settings**: Voice ID, speed, emotion, etc.
- **Language**: ASR language (currently "en-US")

## Testing

1. Start a meeting
2. Check the browser console for "Starting AI agent..." and "AI agent started successfully"
3. The AI will appear as a remote user in the meeting
4. You should hear the greeting message when the AI joins

## Troubleshooting

### AI Agent Doesn't Join
- Check that all environment variables are set
- Verify Agora API credentials are correct
- Check browser console for errors
- Ensure the Agora project has Conversational AI enabled

### AI Agent Fails to Start
- Verify LLM API key is valid
- Check TTS credentials are correct
- Ensure network can reach Agora API endpoints
- Check that the channel name is valid

### No Audio from AI
- Verify TTS credentials
- Check that audio tracks are being subscribed
- Ensure the AI agent UID is unique

## API Endpoints

- `POST /api/agora/convo-ai/start` - Start AI agent
- `POST /api/agora/convo-ai/agents/[agentId]/leave` - Stop AI agent

## Next Steps

1. Configure all environment variables
2. Test the integration
3. Customize the AI persona's behavior
4. Optionally add avatar support (requires Akool credentials)

