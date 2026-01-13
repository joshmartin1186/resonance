import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe, getGenerationLimit } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Create admin client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const customerEmail = session.customer_details?.email
  const metadata = session.metadata || {}
  
  // Check if this is for an existing organization
  const existingOrgId = metadata.organization_id
  
  if (existingOrgId) {
    // Upgrade existing organization
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
      })
      .eq('id', existingOrgId)

    if (error) {
      console.error('Error updating organization:', error)
      throw error
    }
  } else if (customerEmail) {
    // New signup via Stripe - create organization
    const orgName = metadata.org_name || `${customerEmail.split('@')[0]}'s Organization`
    
    // Create organization
    const { data: newOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: orgName,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
        subscription_plan: metadata.plan || 'creator',
        generations_limit: getGenerationLimit(metadata.plan || 'creator'),
      })
      .select('id')
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      throw orgError
    }

    // Log the event
    await supabaseAdmin.from('system_logs').insert({
      organization_id: newOrg.id,
      action_type: 'subscription_created',
      status: 'success',
      severity: 'info',
      message: `New subscription created via Stripe checkout`,
      details: { customer_id: customerId, subscription_id: subscriptionId },
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get the price to determine the plan
  const priceId = subscription.items.data[0]?.price.id
  let plan = 'free'
  
  if (priceId === process.env.STRIPE_PRICE_CREATOR) plan = 'creator'
  else if (priceId === process.env.STRIPE_PRICE_PRO) plan = 'pro'
  else if (priceId === process.env.STRIPE_PRICE_STUDIO) plan = 'studio'

  const status = subscription.status as string
  
  // Map Stripe status to our status
  let subscriptionStatus = 'active'
  if (status === 'past_due') subscriptionStatus = 'past_due'
  else if (status === 'canceled' || status === 'unpaid') subscriptionStatus = 'canceled'
  else if (status === 'trialing') subscriptionStatus = 'trialing'

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      subscription_status: subscriptionStatus,
      subscription_plan: plan,
      generations_limit: getGenerationLimit(plan),
      trial_ends_at: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      subscription_status: 'canceled',
      subscription_plan: 'free',
      generations_limit: 3,
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error handling subscription deletion:', error)
    throw error
  }

  // Log the cancellation
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (org) {
    await supabaseAdmin.from('system_logs').insert({
      organization_id: org.id,
      action_type: 'subscription_canceled',
      status: 'success',
      severity: 'warning',
      message: 'Subscription canceled, reverted to free plan',
    })
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Update status to past_due
  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      subscription_status: 'past_due',
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }

  // Log the failure
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (org) {
    await supabaseAdmin.from('system_logs').insert({
      organization_id: org.id,
      action_type: 'payment_failed',
      status: 'error',
      severity: 'error',
      message: 'Payment failed for subscription',
      details: { invoice_id: invoice.id },
    })
  }
}
