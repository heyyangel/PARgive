/**
 * POST /api/stripe/create-checkout
 * Creates a Stripe Checkout Session for a given plan.
 * Body: { planKey: 'basic' | 'premium' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient }   from '@/lib/supabase/server'
import { getSupabaseAdminClient }    from '@/lib/supabase/server'
import { stripe, PLANS, getOrCreateStripeCustomer, type PlanKey } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body    = await request.json()
    const planKey = body.planKey as PlanKey

    if (!planKey || !PLANS[planKey]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Fetch user profile to get existing Stripe customer id
    const adminClient = getSupabaseAdminClient()
    const { data: profile } = await adminClient
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer({
      userId: user.id,
      email:  user.email!,
      name:   profile?.name,
    })

    const plan = PLANS[planKey]

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price:    plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?cancelled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_key:         planKey,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_key:         planKey,
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[create-checkout]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
