# Resonance - API Integrations

## Required Integrations

### 1. Stripe (Payments & Subscriptions)

**Purpose:** Subscription management, billing, usage tracking

**Webhook Events:**
- `checkout.session.completed` → Create organization + user
- `customer.subscription.updated` → Update subscription status
- `customer.subscription.deleted` → Mark as canceled
- `invoice.payment_failed` → Handle failed payments

### 2. Anthropic API (Claude)

**Purpose:** Visual narrative orchestration

**Model:** claude-sonnet-4-20250514
**Usage:** AI analyzes audio features and creates visual storytelling plan

**Rate Limits:**
- 50 requests per minute
- Implement retry with exponential backoff

**Cost:** ~$0.10-0.30 per video generation

### 3. Google Gemini (Alternative AI)

**Purpose:** Backup orchestration, cost optimization

**Model:** gemini-1.5-flash

### 4. Cloudflare R2 (Video Storage)

**Purpose:** Permanent video output storage

**S3-Compatible API**

## Audio Analysis Libraries

- **Essentia.js** - Research-grade music information retrieval
- **Meyda** - Real-time audio feature extraction
- **Web Audio API** - Built-in browser/Node.js audio processing

## Optional Future Integrations

- SendGrid (Transactional emails)
- Sentry (Error tracking)
- Mixpanel (Product analytics)