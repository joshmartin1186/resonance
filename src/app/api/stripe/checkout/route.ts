import { NextResponse } from 'next/server'
import { stripe, PLANS, PlanType } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  try {
    const { plan, successUrl, cancelUrl } = await request.json()

    // Validate plan
    const planKey = plan?.toLowerCase() as PlanType
    if (!planKey || !PLANS[planKey] || planKey === 'free') {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const selectedPlan = PLANS[planKey]
    if (!selectedPlan.priceId) {
      return NextResponse.json(
        { error: 'Plan price not configured' },
        { status: 500 }
      )
    }

    // Get current user and organization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let customerId: string | undefined
    let organizationId: string | undefined
    let customerEmail: string | undefined

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, organizations(stripe_customer_id)')
        .eq('id', user.id)
        .single()

      if (userData?.organizations) {
        const org = userData.organizations as unknown as { stripe_customer_id: string | null }
        customerId = org.stripe_customer_id || undefined
        organizationId = userData.organization_id
      }
      customerEmail = user.email
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      ...(customerId && { customer: customerId }),
      ...(customerEmail && !customerId && { customer_email: customerEmail }),
      success_url: successUrl || `${origin}/dashboard?checkout=success`,
      cancel_url: cancelUrl || `${origin}/pricing?checkout=canceled`,
      metadata: {
        plan: planKey,
        ...(organizationId && { organization_id: organizationId }),
      },
      subscription_data: {
        metadata: {
          plan: planKey,
          ...(organizationId && { organization_id: organizationId }),
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
