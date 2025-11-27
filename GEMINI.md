# NextGen Intelligent Conversational Agents Development Guide for Gemini

## Project Context

This is a **NextGen Intelligent Conversational Agents** hackathon project built with Next.js, React, TypeScript, Tailwind CSS, **Agora AI**, **Agora SDK**, and **AWS Services**. The focus is on building scalable, intelligent conversational agents that provide natural, context-aware conversations using real-time communication technologies.

## BIG REQUIREMENTS

1. **Agora AI** - PRIMARY conversational AI platform for agent intelligence, NLP/NLU, and agent responses (MUST use)
2. **Agora SDK** - For real-time communication (RTC, RTM, Live Streaming) (MUST use)
3. **AWS Services** - For backend infrastructure, storage, compute, and supporting services (MUST use)

## Core Development Philosophy

### Conversational Agent Mindset
- **Prioritize intelligent agent capabilities** and natural conversation flow above all
- Design agents that provide context-aware, helpful conversations
- Start from user intent and conversation flow before implementing technical solutions
- Keep agent responses clear, helpful, and aligned with business objectives
- Treat security and privacy as core design constraints without compromising functionality
- Use real-time communication as a functional foundation that enables seamless agent interactions
- Favor clarity and reliability over cleverness in both design and code
- Build systems that scale for diverse use cases (B2B, healthcare, education, accessibility)
- Prioritize real-time performance and low-latency agent responses

### Code Style Standards
- Use **tabs** for all indentation
- Use **single quotes** for strings (except when escaping)
- **No semicolons** unless required by JavaScript rules
- Remove all unused variables
- Add space after keywords: `if (value)`
- Add space before function parentheses: `function name ()`
- Always use strict equality `===`
- Space infix operators: `a + b`
- Space after commas: `[a, b, c]`
- Else goes on the same line: `} else {`
- Use curly braces for multi-line blocks
- Always handle error parameters
- Keep line width at 80 characters
- Use trailing commas in multiline objects and arrays

## Architecture Principles

### Layered Architecture for Conversational Agents

**Services Layer:**
- **MUST use Agora AI** as PRIMARY conversational AI platform for agent intelligence and NLP/NLU
- **MUST use Agora SDK** for real-time communication (RTC, RTM, Live Streaming)
- **MUST use AWS services** for backend infrastructure, storage, and compute
- Provide stable access to Agora AI API and Agora SDK (RTC, RTM, Live Streaming)
- Integrate Agora AI for NLP/NLU, intent recognition, entity extraction, and agent responses (PRIMARY)
- Use AWS Lambda for serverless backend processing and API Gateway for endpoints
- Leverage AWS DynamoDB for conversation storage and S3 for media/assets
- Transform raw agent data into conversation-ready shapes optimized for real-time interactions
- Keep network logic out of UI components while supporting real-time communication
- Manage agent state and conversation context across sessions using AWS services

**Hooks Layer:**
- Manage real-time state transitions for agent interactions (RTC connections, RTM messages, agent responses)
- Use descriptive naming that matches agent behavior: `useAgoraRTC`, `useRTMMessaging`, `useAgentConversation`, `useAgoraAI`, `useHumanHandoff`
- Keep business flow logic outside components while enabling real-time agent capabilities
- Handle connection lifecycle and reconnection strategies

**Server Actions:**
- Handle agent mutations with predictable patterns (conversation logs, agent routing, human handoff)
- Provide clear stages for loading, success, and errors in agent interactions
- Align actions with visible UX feedback that enhances agent reliability
- Support agent-to-human escalation workflows

**Components Layer:**
- Act as real-time building blocks for conversational agent presentation
- Follow a consistent design system that supports diverse agent interactions
- Support flexibility for various agent types (text, voice, video) without breaking design rules
- Prioritize real-time components: `AgentChat`, `AgentVideoCall`, `AgentLiveStream`, `CollaborationTools`, `HumanHandoff`

### Data Flow Guarantees
- All agent reads must include loading, empty, and error states
- All agent writes must include user feedback and safe optimistic updates
- Agent data must always be shaped before reaching the UI for optimal real-time presentation
- Real-time communication must handle connection failures gracefully
- Agent responses must be debounced/throttled appropriately for performance

## File Structure

```
src/
  components/
    ui/              # Base UI components (buttons, inputs, etc.)
    layout/          # Layout components (Navigation, Footer)
    agents/          # Agent-specific components
      AgentChat.tsx
      AgentVideoCall.tsx
      AgentLiveStream.tsx
      CollaborationTools.tsx
      HumanHandoff.tsx
      AgentSettings.tsx
    realtime/        # Real-time communication components
      AgoraRTC.tsx
      AgoraRTM.tsx
      AgoraLiveStream.tsx
  hooks/
    useAgoraRTC.ts
    useAgoraRTM.ts
    useAgentConversation.ts
    useAgoraAI.ts
    useHumanHandoff.ts
    useAgentContext.ts
  services/
    agora/
      agoraAIService.ts      # Agora AI - PRIMARY
      agoraRTCService.ts
      agoraRTMService.ts
      agoraLiveStreamService.ts
    agentService.ts
    conversationService.ts
    aws/
      dynamoService.ts
      s3Service.ts
      cognitoService.ts
      lambdaService.ts
      comprehendService.ts   # complementary
      bedrockService.ts      # complementary
  lib/
    agora/
      agoraAIConfig.ts      # Agora AI config
      agoraRTCConfig.ts
      agoraRTMConfig.ts
    agentUtils.ts
    conversationHelpers.ts
    aws/
      awsConfig.ts
      awsClient.ts
      awsUtils.ts
  app/              # Next.js App Router (feature folders)
    (routes)/
      chat/
        page.tsx
      video/
        page.tsx
      streaming/
        page.tsx
infrastructure/
  cdk/              # AWS CDK infrastructure as code
  cloudformation/   # CloudFormation templates
  sam/              # AWS SAM templates
```

## Naming Conventions

- **Hooks:** Describe agent behavior - `useAgoraRTC`, `useRTMMessaging`, `useAgentConversation`, `useAgoraAI`, `useHumanHandoff`
- **Services:** Describe agent data sources - `agoraAIService` (PRIMARY), `agoraRTCService`, `agoraRTMService`, `agentService`, `conversationService`
- **AWS services:** Use descriptive names - `dynamoService`, `s3Service`, `cognitoService`, `lambdaService`
- **Components:** Describe what the user sees - `AgentChat`, `AgentVideoCall`, `AgentLiveStream`, `CollaborationTools`
- **Files:** Match default exports exactly, use kebab-case
- Avoid abbreviations that hide meaning, especially for agent features
- Agora AI service files should clearly indicate Agora AI usage (e.g., `agoraAIService.ts`)
- AWS service files should clearly indicate AWS service usage (e.g., `awsDynamoService.ts`)

## React Component Architecture

### Agent Components
- Keep components small and single purpose (`AgentChat`, `VideoCall`, `LiveStream`)
- Extract non-visual logic into hooks while maintaining real-time capabilities
- Build predictable interactions that enhance agent reliability
- Use props that describe agent intent, not mechanics
- Follow a spacing and sizing scale that matches the agent design system
- Prioritize real-time components that present agent interactions clearly

### Component Composition
Agent components should function like modular real-time building blocks:
- **Composable** - mix and match for different agent types
- **Reusable** - across different conversation modes
- **Flexible** - support diverse agent capabilities
- **Clean** - maintain visual consistency
- **Consistent** - follow agent design system

### Props for Agent Components
- Use clear names: `onAgentResponse`, `onConnectionChange` (not ambiguous names)
- Optional props must be truly optional, especially for agent variations
- Components should accept `className` for styling extension and customization
- Favor controlled components for agent interactions (chat, video, streaming)
- Support agent variations through flexible prop structures

## Styling & Design System

### Tailwind CSS for Conversational Agents
- Use a consistent spacing scale that supports agent layouts
- Use design tokens for color, radius, and typography that enhance agent presentation
- No arbitrary values unless required for agent layouts
- Keep class lists readable and organized, especially for complex agent components
- Support typography scales for agent messages and conversation UI

### Layout and Responsiveness
- Use mobile-first rules that maintain agent functionality on all devices
- Use consistent grid and spacing systems that showcase agent interactions effectively
- Respect visual hierarchy through font scales and weight patterns for agent content
- Support agent layouts (chat, video, streaming) for diverse conversation modes
- Ensure agent interfaces work seamlessly on all screen sizes

## Next.js App Router Standards

### Routing for Conversational Agents
- Keep agent feature folders isolated (`chat`, `video`, `streaming`, `collaboration`)
- Use layout files for shared agent UI (navigation, connection status)
- Keep pages thin and delegate logic to hooks and services
- Support dynamic routes for agent sessions and conversations
- Optimize agent routes for performance and real-time capabilities

### Server Components
- Use for agent data fetching and layout structure
- Avoid client-side state inside server components
- Optimize agent content delivery for performance
- Support agent metadata and SEO optimization

### Client Components
- Used only for interactive agent UI (chat, video, real-time interactions)
- Support real-time animations and interactions
- Handle agent user interactions (messages, calls, streaming)
- Enable real-time connection status and error handling

## Data Management

### Fetching Agent Content
- Use server components or server actions when possible for agent data
- Always define loading and empty states for agent sections
- Avoid duplicating agent fetch logic
- Optimize agent response times and real-time data loading
- Support agent content caching strategies using AWS ElastiCache

### Mutations for Agent Interactions
- Use server actions or dedicated service functions for agent forms
- Provide user-centered feedback for agent interactions
- Use optimistic updates only when safe for agent actions
- Handle agent conversation logs and analytics gracefully using AWS DynamoDB

## Agora AI Integration (PRIMARY)

### Agora AI Platform
- **MUST use Agora AI** as PRIMARY conversational AI platform
- Integrate Agora AI API for agent intelligence, NLP/NLU, and conversation management
- Use Agora AI for intent recognition and entity extraction (PRIMARY)
- Leverage Agora AI for natural language understanding and agent responses
- Implement Agora AI for conversation context management and multi-turn conversations
- Use Agora AI for agent personality and tone customization
- Support Agora AI conversation routing and escalation logic
- Implement proper error handling and fallback for Agora AI service

### Agora AI Features
- Integrate Agora AI for real-time agent responses
- Use Agora AI for conversation analytics and learning
- Leverage Agora AI for specialized agent capabilities (B2B, healthcare, education)
- Implement Agora AI for knowledge base integration
- Use Agora AI for predictive analytics and proactive suggestions
- Support Agora AI for multi-language and localization

## Agora SDK Integration

### Agora RTC (Real-Time Communication)
- Initialize RTC client with proper error handling
- Handle connection lifecycle (join, leave, reconnection)
- Manage audio/video tracks and device permissions
- Implement proper cleanup on component unmount
- Handle network quality and connection state changes
- Support screen sharing and remote video rendering
- Implement proper error recovery and fallback mechanisms

### Agora RTM (Real-Time Messaging)
- Initialize RTM client with authentication
- Handle message sending and receiving with proper error handling
- Manage channel subscriptions and unsubscriptions
- Implement message queuing for offline scenarios
- Handle connection state and reconnection logic
- Support peer-to-peer and channel messaging
- Implement proper message delivery confirmation

### Agora Live Streaming
- Configure live streaming with proper settings
- Handle stream publishing and subscribing
- Manage stream quality and adaptive bitrate
- Implement proper stream error handling
- Support multi-host streaming scenarios
- Handle viewer interactions and engagement

### Agora Collaboration Tools
- Integrate whiteboard and screen sharing capabilities
- Handle file sharing and document collaboration
- Manage participant permissions and roles
- Implement proper session management
- Support breakout rooms and group collaboration

## AWS Services Integration

### AWS Services Architecture
- **MUST use AWS services** for backend infrastructure, storage, and compute
- Design agent architecture leveraging AWS serverless and managed services
- Use AWS Lambda for serverless backend processing and business logic
- Implement AWS API Gateway for RESTful and WebSocket APIs
- Leverage AWS DynamoDB for conversation storage, user data, and agent state
- Use AWS S3 for media storage (audio, video, documents, agent assets)
- Implement AWS Cognito for authentication and user management
- Use AWS CloudWatch for monitoring, logging, and observability
- Leverage AWS IAM for security and access control

### AWS AI/ML Services (Complementary)
- **Use AWS Bedrock** for LLM integration as complementary to Agora AI
- Leverage **AWS Comprehend** for additional NLP/NLU capabilities if needed
- Use **AWS Transcribe** for speech-to-text in agent interactions
- Use **AWS Polly** for text-to-speech in agent responses
- Leverage **AWS Rekognition** for image/video analysis if needed
- Use **AWS SageMaker** for custom ML model training and deployment
- Implement **AWS Kendra** for intelligent search and knowledge base integration

### AWS Real-Time & Communication Services
- Use **AWS AppSync** for real-time GraphQL subscriptions
- Leverage **AWS IoT Core** for real-time messaging if applicable
- Use **AWS EventBridge** for event-driven agent architecture
- Implement **AWS SQS** and **AWS SNS** for message queuing and notifications
- Use **AWS Kinesis** for real-time data streaming and analytics
- Leverage **AWS CloudFront** for CDN and global content delivery

### AWS Storage & Database Services
- Use **AWS DynamoDB** for conversation logs, user data, and agent state (NoSQL)
- Implement **AWS RDS** or **AWS Aurora** for relational data if needed
- Use **AWS S3** for media storage, agent assets, and conversation backups
- Leverage **AWS ElastiCache** (Redis/Memcached) for caching and session management
- Use **AWS DocumentDB** for document storage if needed
- Implement **AWS Glacier** for long-term conversation archive storage

### AWS Security & Compliance Services
- Use **AWS Cognito** for user authentication and authorization
- Implement **AWS Secrets Manager** for API keys, tokens, and sensitive data
- Use **AWS KMS** for encryption key management
- Leverage **AWS WAF** for web application firewall protection
- Use **AWS Shield** for DDoS protection
- Implement **AWS CloudTrail** for audit logging and compliance
- Use **AWS GuardDuty** for threat detection
- Leverage **AWS IAM** for fine-grained access control

## Error Handling & User Feedback

### Error Principles for Conversational Agents
- Errors should be communicated in a friendly and helpful way
- Avoid technical jargon for user-facing messages
- Provide clear recovery steps for agent interactions
- Maintain agent aesthetic even in error states
- Handle connection failures gracefully with retry mechanisms

### UX Feedback States
- **Loading:** Represent progress clearly while maintaining agent presentation
- **Success:** Confirm agent actions (messages sent, calls connected)
- **Failure:** Explain the next step for agent interactions
- **Empty states:** Provide engaging messaging for empty agent conversations
- **Connection states:** Clearly indicate RTC/RTM connection status

## Accessibility & Interaction

### Accessibility in Conversational Agents
- Use semantic elements for agent structure
- Use aria attributes when required for agent interactions
- Maintain contrast ratios while preserving agent aesthetics
- Support keyboard navigation for agent browsing
- Ensure agent interactions don't interfere with accessibility
- Support screen readers for agent conversations

### Interaction for Conversational Agents
- Real-time updates should enhance agent experience, not distract
- Provide clear focus states for agent navigation
- Use consistent timing for agent animations
- Support agent hover states and micro-interactions
- Balance agent functionality with usability

## Performance

### Rendering for Agent Sites
- Avoid unnecessary rerenders in agent components
- Use `memo` and `useCallback` when needed for agent interactions
- Keep agent components small and focused
- Optimize agent animations for 60fps performance
- Minimize re-renders during real-time updates

### Assets for Conversational Agents
- Optimize agent images for web while maintaining visual quality
- Use Next.js Image for proper agent image resizing and optimization
- Avoid loading unnecessary scripts that slow agent presentation
- Implement lazy loading for agent features
- Support modern image formats (WebP, AVIF) for agent content

## Conversational Agent Patterns

### Real-Time Communication Patterns
- Implement connection state management (connecting, connected, disconnected, reconnecting)
- Handle network quality changes and adaptive quality adjustment
- Support multiple concurrent connections and channels
- Implement proper message ordering and delivery confirmation
- Handle connection failures with graceful degradation
- Support both peer-to-peer and channel-based communication

### Agent Intelligence Patterns
- Implement context-aware conversation management using Agora AI
- Handle multi-turn conversations with proper context retention
- Support agent personality and tone customization
- Implement conversation analytics and learning
- Handle agent routing and escalation logic (agent-to-human handoff)
- Support specialized knowledge base integration

### Performance Patterns
- Implement lazy loading for agent features
- Optimize agent interfaces for fast loading
- Use code splitting for agent sections
- Cache agent data appropriately using AWS ElastiCache
- Monitor agent Core Web Vitals
- Optimize real-time communication for low latency

### Security Patterns
- Implement proper authentication using AWS Cognito
- Encrypt sensitive conversation data using AWS KMS
- Handle secure token management for Agora SDK
- Implement rate limiting for agent interactions
- Support secure file uploads and sharing
- Monitor and log security events using AWS CloudTrail

## Key Technologies

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI Library:** React 19+
- **Styling:** Tailwind CSS 4+
- **Conversational AI:** Agora AI (PRIMARY)
- **Real-Time Communication:** Agora SDK (RTC, RTM, Live Streaming)
- **Backend:** AWS Lambda, AWS API Gateway
- **Database:** AWS DynamoDB
- **Storage:** AWS S3
- **Authentication:** AWS Cognito
- **Monitoring:** AWS CloudWatch
- **Infrastructure:** AWS CDK, AWS CloudFormation, AWS SAM

## When Working on This Project

1. **Always prioritize Agora AI** - Use Agora AI as PRIMARY for agent intelligence and NLP/NLU
2. **Think about real-time communication** - How does this enhance agent interactions?
3. **Maintain performance** - Agent features should be fast and responsive
4. **Ensure security and privacy** - Protect user data and conversations
5. **Follow the architecture** - Use the layered approach for maintainability
6. **Write clean, readable code** - Future developers need to understand it
7. **Test agent features** - Real-time communication and AI responses should work flawlessly
8. **Optimize for agent goals** - Help users get information, complete tasks, or get support
9. **Use AWS services** - Leverage AWS for backend infrastructure, storage, and compute
10. **Handle errors gracefully** - Agent interactions should recover from failures

## Common Agent Components to Build

- **AgentChat** - Text-based conversation interface with Agora AI
- **AgentVideoCall** - Video/audio call interface with Agora RTC
- **AgentLiveStream** - Live streaming interface with Agora Live Streaming
- **CollaborationTools** - Whiteboard, screen sharing, file sharing
- **HumanHandoff** - Escalation from agent to human support
- **AgentSettings** - Agent configuration and preferences
- **ConnectionStatus** - Real-time connection status indicators
- **MessageHistory** - Conversation history and context
- **AgentAnalytics** - Agent performance and conversation analytics

## Focus Areas for Hackathon

### AI/ML
- Automation and intelligent agent capabilities
- Analytics and conversation insights
- Predictive systems for agent interactions

### Sustainability & Climate Action
- Energy efficiency in agent processing
- Environmental impact monitoring
- Optimize resource usage

### Cybersecurity & Data Privacy
- Secure agent conversations
- Ethical AI practices
- Data privacy compliance (GDPR, HIPAA)

### Digital Transformation & Empowerment
- Education: Learning agents and tutoring
- Healthcare: Telemedicine and patient support
- Accessibility: Inclusive agent design

## Remember

This is a **NextGen Intelligent Conversational Agents** project - the code should enable intelligent, real-time conversations that help users effectively. Balance technical excellence with intelligent agent capabilities, and always consider how your code impacts the conversation quality, real-time performance, and user experience of the agent system. **MUST use Agora AI, Agora SDK, and AWS Services** as specified in the BIG REQUIREMENTS.
