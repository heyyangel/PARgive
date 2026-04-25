/**
 * POST /api/stripe/create-portal
 * Creates a Stripe Customer Portal session for billing management.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient }   from '@/lib/supabase/server'
import { stripe }                    from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch Stripe subscription to get customer id
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Retrieve the subscription to get the customer id
    const stripeSubscription = await stripe.subscriptions.retrieve(
      sub.stripe_subscription_id
    )
    const customerId = stripeSubscription.customer as string

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err: any) {
    console.error('[create-portal]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
