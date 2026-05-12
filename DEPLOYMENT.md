# WhatsApp Business AI Agent SaaS - Deployment Guide

## Production Environment Setup

### Prerequisites
- Node.js 22.x or later
- MySQL/TiDB database
- Meta WhatsApp Business Account with API access
- Groq API key for LLM integration

### Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/whatsapp_ai_agent

# OAuth & Authentication
JWT_SECRET=<generate-secure-random-string>
VITE_APP_ID=<manus-oauth-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
OWNER_OPEN_ID=<owner-user-id>
OWNER_NAME=<owner-name>

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<forge-api-key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<frontend-forge-api-key>

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=<website-id>

# Application
VITE_APP_TITLE=WhatsApp Business AI Agent
VITE_APP_LOGO=https://your-domain/logo.png
NODE_ENV=production
PORT=3000
```

## WhatsApp Webhook Configuration

### 1. Register Webhook URL with Meta

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps)
2. Select your WhatsApp Business App
3. Navigate to **Webhooks** in the left menu
4. Click **Edit Subscription**
5. Set the Callback URL to: `https://your-domain.com/api/webhooks/whatsapp`
6. Set the Verify Token to a secure random string (save this in database during onboarding)
7. Subscribe to these webhook fields:
   - `messages`
   - `message_status`
   - `message_template_status_update`

### 2. Test Webhook Verification

```bash
curl -X GET "https://your-domain.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test_challenge"
```

Expected response: `test_challenge`

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] WhatsApp webhook URL registered with Meta
- [ ] Groq API key validated
- [ ] OAuth credentials verified

### Deployment Steps

1. **Build the application:**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Run database migrations:**
   ```bash
   pnpm db:push
   ```

3. **Start the server:**
   ```bash
   pnpm start
   ```

4. **Verify webhook is accessible:**
   ```bash
   curl -I https://your-domain.com/api/webhooks/whatsapp
   ```

### Post-Deployment Verification

- [ ] Application loads without errors
- [ ] OAuth login works
- [ ] Onboarding flow completes
- [ ] Dashboard displays correctly
- [ ] WhatsApp webhook receives messages
- [ ] AI responses are generated
- [ ] Escalation detection works
- [ ] Analytics panel shows data

## Monitoring & Logging

### Key Metrics to Monitor

1. **Webhook Processing**
   - Message ingestion rate
   - Processing latency
   - Error rate

2. **AI Agent**
   - Response generation time
   - Escalation detection accuracy
   - LLM API errors

3. **Database**
   - Query performance
   - Connection pool usage
   - Backup status

4. **Application**
   - Server uptime
   - Error rates
   - Response times

### Log Locations

- **Server logs**: `.manus-logs/devserver.log`
- **Browser console**: `.manus-logs/browserConsole.log`
- **Network requests**: `.manus-logs/networkRequests.log`
- **Session replay**: `.manus-logs/sessionReplay.log`

### Recommended Monitoring Tools

- Sentry for error tracking
- Datadog for infrastructure monitoring
- CloudWatch for AWS deployments
- Custom dashboards for business metrics

## Scaling Considerations

### Database
- Add indexes on `phoneNumberId`, `businessId`, `conversationId`
- Consider read replicas for analytics queries
- Archive old messages to separate storage

### Message Processing
- Implement message queue (Redis/RabbitMQ) for reliability
- Scale webhook workers horizontally
- Cache conversation context for faster AI processing

### AI Agent
- Batch LLM requests when possible
- Implement response caching for common queries
- Monitor Groq API rate limits

## Security Checklist

- [ ] All secrets stored in environment variables
- [ ] Database credentials rotated regularly
- [ ] SSL/TLS enabled for all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled on webhook endpoint
- [ ] Multi-tenant isolation verified
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

## Rollback Procedure

If deployment fails:

1. Revert to previous version:
   ```bash
   git revert <commit-hash>
   pnpm build
   pnpm start
   ```

2. If database migration failed:
   ```bash
   # Restore from backup
   mysql < backup.sql
   ```

3. Notify users of any service disruption

## Support & Troubleshooting

### Common Issues

**Webhook not receiving messages:**
- Verify webhook URL is publicly accessible
- Check verify token matches Meta configuration
- Review firewall/security group rules
- Check application logs for errors

**AI responses not generating:**
- Verify Groq API key is valid
- Check API rate limits
- Review error logs
- Verify conversation context is stored

**Database connection errors:**
- Verify DATABASE_URL is correct
- Check database server is running
- Verify network connectivity
- Review connection pool settings

### Support Contacts

- Technical Support: support@example.com
- Meta WhatsApp Support: https://www.whatsapp.com/business/support
- Groq API Support: https://console.groq.com/support

## Maintenance Schedule

- **Daily**: Monitor error rates and webhook processing
- **Weekly**: Review analytics and performance metrics
- **Monthly**: Database optimization and backup verification
- **Quarterly**: Security audit and dependency updates
- **Annually**: Full system review and capacity planning
