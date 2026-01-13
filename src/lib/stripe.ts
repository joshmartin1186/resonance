import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe features will not work.')
}

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null

// Pricing configuration
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    generationLimit: 3,
    maxDuration: 2, // minutes
    resolution: 'SD',
    features: [
      '3 generations per month',
      'Up to 2 minute videos',
      'SD quality (720p)',
      'Watermark on videos',
    ],
  },
  creator: {
    name: 'Creator',
    price: 29,
    priceId: process.env.STRIPE_PRICE_CREATOR,
    generationLimit: 20,
    maxDuration: 5,
    resolution: 'HD',
    features: [
      '20 generations per month',
      'Up to 5 minute videos',
      'HD quality (1080p)',
      'No watermark',
      'Save favorite seeds',
    ],
  },
  pro: {
    name: 'Pro',
    price: 79,
    priceId: process.env.STRIPE_PRICE_PRO,
    generationLimit: -1, // unlimited
    maxDuration: 10,
    resolution: '4K',
    features: [
      'Unlimited generations',
      'Up to 10 minute videos',
      '4K quality',
      'No watermark',
      'Save favorite seeds',
      'Live recording mode',
      'Commercial license',
    ],
  },
  studio: {
    name: 'Studio',
    price: 199,
    priceId: process.env.STRIPE_PRICE_STUDIO,
    generationLimit: -1,
    maxDuration: 10,
    resolution: '4K',
    features: [
      'Everything in Pro',
      'Batch processing',
      'API access',
      'White-label option',
      'Priority support',
      'Custom integrations',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS

/**
 * Get plan details by name
 */
export function getPlan(planName: string): typeof PLANS[PlanType] | null {
  const normalized = planName.toLowerCase() as PlanType
  return PLANS[normalized] || null
}

/**
 * Get generation limit for a plan
 */
export function getGenerationLimit(planName: string): number {
  const plan = getPlan(planName)
  return plan?.generationLimit ?? 3
}
