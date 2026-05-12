# WhatsApp Business AI Agent SaaS - Feature Overview

## Core Features

### 1. Google OAuth Authentication
- Seamless Google login integration
- Multi-tenant user management
- Session persistence across devices
- Secure logout functionality

### 2. Business Onboarding Flow
Four-step wizard for complete setup:
1. **Business Profile**: Enter business name and description
2. **WhatsApp Credentials**: Connect Phone Number ID, Access Token, Verify Token
3. **AI Agent Configuration**: Set agent name, persona, and system prompt
4. **Review & Confirm**: Verify all settings before activation

### 3. WhatsApp Cloud API Integration
- Bi-directional message flow with Meta's WhatsApp Business API
- Webhook verification and secure message handling
- Support for text, image, document, audio, and video messages
- Message delivery status tracking
- 24-hour messaging window compliance

### 4. AI-Powered Auto-Reply Engine
- **Groq LLM Integration**: Fast, accurate responses using Groq's API
- **Full Conversation Context**: AI considers entire message history
- **Configurable Persona**: Customize agent name, tone, and behavior
- **System Prompt**: Define specific instructions for AI behavior
- **Escalation Detection**: Automatically detect when human support is needed
- **Smart Toggle**: Enable/disable AI with a single switch

### 5. Escalation Management
- **Keyword Detection**: Recognize escalation triggers (e.g., "agent", "help", "complaint")
- **Automatic Flagging**: Conversations marked as "Waiting for You" when escalated
- **Human Takeover**: Business can manually reply when AI is disabled
- **Escalation Notifications**: Real-time alerts for urgent conversations

### 6. Real-Time Chat Dashboard
- **WhatsApp-Style Interface**: Familiar conversation list and thread view
- **Conversation List**: Search, filter, and sort conversations
- **Unread Indicators**: Visual badges for new messages
- **Last Message Preview**: Quick overview of conversation state
- **Escalation Section**: Dedicated area for conversations needing attention
- **Message Thread**: Full conversation history with timestamps

### 7. AI Toggle System
- **Prominent Switch**: Easy access in chat header
- **Visual Feedback**: Clear indication of AI status (Active/Inactive)
- **Instant Switching**: Toggle AI on/off without page reload
- **Per-Conversation Control**: Different settings for each customer
- **Manual Mode**: Send custom replies when AI is disabled

### 8. Analytics Dashboard
- **Total Messages**: Count of all messages sent and received
- **Active Conversations**: Number of ongoing customer interactions
- **AI Response Rate**: Percentage of messages handled by AI
- **Escalation Count**: Number of conversations requiring human support
- **Real-Time Updates**: Live metrics reflecting current activity

### 9. Multi-Tenant Architecture
- **Complete Data Isolation**: Each business has separate conversations and messages
- **Secure Routing**: Messages routed to correct tenant via Phone Number ID
- **Tenant-Scoped Queries**: All database queries filtered by business ID
- **Independent Configuration**: Each business has unique AI settings
- **No Cross-Tenant Leakage**: Strict enforcement of data boundaries

### 10. Message Management
- **Persistent Storage**: All messages stored with timestamps
- **Read/Unread Status**: Track conversation engagement
- **Message Types**: Support for text, images, documents, audio, video
- **Delivery Status**: Track sent, delivered, read states
- **Conversation History**: Full context for AI and human review

## Technical Architecture

### Backend Stack
- **Express.js**: REST API and webhook server
- **tRPC**: Type-safe API procedures
- **Drizzle ORM**: Database access and migrations
- **MySQL/TiDB**: Multi-tenant data storage
- **Groq API**: LLM for AI responses
- **Meta WhatsApp API**: Message delivery

### Frontend Stack
- **React 19**: Modern UI framework
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components
- **tRPC Client**: Type-safe API calls
- **Wouter**: Lightweight routing
- **Sonner**: Toast notifications

### Database Schema
- **users**: Authentication and user management
- **businesses**: Business profiles and WhatsApp credentials
- **agents**: AI agent configurations per business
- **conversations**: Customer interactions
- **messages**: Individual messages with metadata
- **escalations**: Escalation tracking and resolution

## Security Features

### Multi-Tenant Isolation
- Database-level tenant filtering on all queries
- Webhook routing by Phone Number ID
- User authorization checks on all endpoints
- No cross-tenant data access possible

### Data Protection
- Encrypted credential storage (Phone Number ID, Access Token, Verify Token)
- Secure session management with JWT
- HTTPS/TLS for all communications
- SQL injection prevention via ORM

### API Security
- Webhook verification with Meta's challenge-response
- Rate limiting on webhook endpoint
- CORS configuration for frontend
- Input validation on all endpoints

## Performance Optimizations

### Database
- Indexed queries on frequently accessed fields
- Connection pooling for efficient resource usage
- Optimized conversation and message retrieval

### Message Processing
- Asynchronous webhook handling
- Batch message storage
- Efficient LLM context window management (up to 1000 messages)

### Frontend
- Code splitting and lazy loading
- Optimized component re-renders
- Efficient state management with tRPC

## Monitoring & Observability

### Logging
- Server startup and webhook registration
- Message ingestion and processing
- AI response generation
- Error tracking and debugging

### Metrics
- Message throughput
- AI response latency
- Escalation rate
- Error rate

### Health Checks
- Database connectivity
- Webhook endpoint availability
- OAuth service status
- Groq API availability

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Production environment setup
- WhatsApp webhook configuration
- Deployment checklist
- Monitoring and logging
- Scaling considerations
- Security verification
- Troubleshooting guide

## Quick Start

### Development
```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

### First Time Setup
1. Navigate to http://localhost:3000
2. Click "Login with Google"
3. Complete onboarding flow
4. Configure WhatsApp credentials
5. Set up AI agent
6. Start receiving messages!

## API Endpoints

### Public
- `GET /api/webhooks/whatsapp` - Webhook verification
- `POST /api/webhooks/whatsapp` - Incoming messages
- `GET /api/oauth/callback` - OAuth callback

### Protected (tRPC)
- `trpc.auth.me` - Get current user
- `trpc.auth.logout` - Logout
- `trpc.onboarding.*` - Onboarding procedures
- `trpc.conversations.*` - Conversation management
- `trpc.analytics.*` - Analytics queries

## Support & Documentation

- **Issues**: Report bugs via GitHub issues
- **Discussions**: Ask questions in GitHub discussions
- **Email**: support@example.com
- **Docs**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for operations guide

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.
