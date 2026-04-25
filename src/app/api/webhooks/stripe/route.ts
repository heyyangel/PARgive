/**
 * POST /api/webhooks/stripe
 * Handles all Stripe subscription lifecycle events.
 *
 * Events handled:
 *  - checkout.session.completed       → activate subscription
 *  - customer.subscription.updated    → sync plan/status changes
 *  - customer.subscription.deleted    → mark cancelled
 *  - invoice.payment_succeeded        → update renewal date
 *  - invoice.payment_failed           → mark past_due
 */
import { NextRequest, NextResponse } from 'next/server'
import Stripe                        from 'stripe'
import { stripe, PLANS }             from '@/lib/stripe'
import { getSupabaseAdminClient }    from '@/lib/supabase/server'
import type { SubscriptionStatus, SubscriptionPlan } from '@/lib/supabase/types'
import { sendSubscriptionEmail, sendPaymentConfirmationEmail } from '@/lib/email'

// ─── Disable Next.js body parsing — Stripe needs the raw body ─
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  try {
    switch (event.type) {
      // ── New subscription checkout completed ──────────────────
      case 'checkout.session.completed': {
        const session    = event.data.object as Stripe.Checkout.Session
        const userId     = session.metadata?.supabase_user_id
        const planKey    = session.metadata?.plan_key as 'basic' | 'premium' | undefined
        const subId      = session.subscription as string

        if (!userId || !subId) break

        const sub = await stripe.subscriptions.retrieve(subId)

        const renewalDate = new Date(sub.current_period_end * 1000).toISOString()
        await upsertSubscription(admin, {
          userId,
          stripeSubId:  subId,
          plan:         planKey ?? 'basic',
          status:       'active',
          renewalDate,
        })

        // Send welcome email
        try {
          const { data: userRow } = await admin.from('users').select('name, email').eq('id', userId).single()
          if (userRow?.email) {
            const planLabel = planKey === 'premium' ? 'Yearly' : 'Monthly'
            const planAmount = planKey === 'premium' ? '79.99' : '9.99'
            await sendSubscriptionEmail(userRow.email, {
              name:      userRow.name ?? 'there',
              plan:      planLabel,
              amount:    planAmount,
              renewDate: new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            })
          }
        } catch (emailErr) { console.error('[webhook] Email send failed:', emailErr) }
        break
      }

      // ── Subscription plan/status changed ────────────────────
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id

        if (!userId) {
          // Fallback: look up by stripe_subscription_id
          const { data } = await admin
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .single()
          if (!data) break
          await syncSubscription(admin, data.user_id, sub)
        } else {
          await syncSubscription(admin, userId, sub)
        }
        break
      }

      // ── Subscription cancelled / expired ────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id

        const targetId = userId ?? await getUserIdFromSubId(admin, sub.id)
        if (!targetId) break

        await admin
          .from('subscriptions')
          .update({
            status:       'cancelled',
            renewal_date: null,
          })
          .eq('user_id', targetId)

        await admin
          .from('users')
          .update({ subscription_status: 'cancelled' })
          .eq('id', targetId)
        break
      }

      // ── Invoice paid → renewal confirmed ────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (!subId) break

        const sub    = await stripe.subscriptions.retrieve(subId)
        const userId = sub.metadata?.supabase_user_id ?? await getUserIdFromSubId(admin, subId)
        if (!userId) break

        // current_period_end moved to items[0] in Stripe API 2024-11-20+
        const periodEnd = sub.items?.data?.[0]?.current_period_end

        await admin
          .from('subscriptions')
          .update({
            status:       'active',
            renewal_date: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq('user_id', userId)

        await admin
          .from('users')
          .update({ subscription_status: 'active' })
          .eq('id', userId)

        // Send payment confirmation
        try {
          const { data: userRow } = await admin.from('users').select('name, email').eq('id', userId).single()
          if (userRow?.email && invoice.amount_paid) {
            await sendPaymentConfirmationEmail(userRow.email, {
              name:        userRow.name ?? 'there',
              amount:      (invoice.amount_paid / 100).toFixed(2),
              description: 'Subscription renewal',
              date:        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            })
          }
        } catch (emailErr) { console.error('[webhook] Payment email failed:', emailErr) }
        break
      }

      // ── Invoice payment failed ───────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (!subId) break

        const userId = await getUserIdFromSubId(admin, subId)
        if (!userId) break

        await admin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('user_id', userId)

        await admin
          .from('users')
          .update({ subscription_status: 'past_due' })
          .eq('id', userId)
        break
      }

      default:
        // Unhandled event — log and return 200 so Stripe doesn't retry
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[webhook] Handler error:', err)
    return NextResponse.json({ error: 'Internal handler error' }, { status: 500 })
  }
}

// ─── Helpers ──────────────────────────────────────────────────

type AdminClient = ReturnType<typeof getSupabaseAdminClient>

async function upsertSubscription(
  admin: AdminClient,
  opts: {
    userId:      string
    stripeSubId: string
    plan:        SubscriptionPlan
    status:      SubscriptionStatus
    renewalDate: string
  }
) {
  await admin
    .from('subscriptions')
    .upsert(
      {
        user_id:                opts.userId,
        stripe_subscription_id: opts.stripeSubId,
        plan:                   opts.plan,
        status:                 opts.status,
        renewal_date:           opts.renewalDate,
      },
      { onConflict: 'user_id' }
    )

  await admin
    .from('users')
    .update({
      subscription_status: opts.status,
      subscription_plan:   opts.plan,
      subscription_start:  new Date().toISOString(),
    })
    .eq('id', opts.userId)
}

async function syncSubscription(
  admin:  AdminClient,
  userId: string,
  sub:    Stripe.Subscription
) {
  const rawStatus = sub.status
  const statusMap: Record<string, SubscriptionStatus> = {
    active:            'active',
    trialing:          'trialing',
    past_due:          'past_due',
    canceled:          'cancelled',
    unpaid:            'past_due',
    incomplete:        'inactive',
    incomplete_expired:'inactive',
    paused:            'inactive',
  }
  const status = statusMap[rawStatus] ?? 'inactive'

  // current_period_end moved from Subscription root → items[0] in Stripe API 2024-11-20+
  const periodEnd: number | null | undefined =
    sub.items?.data?.[0]?.current_period_end

  await admin
    .from('subscriptions')
    .update({
      status,
      renewal_date: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq('user_id', userId)

  await admin
    .from('users')
    .update({ subscription_status: status })
    .eq('id', userId)
}

async function getUserIdFromSubId(admin: AdminClient, stripeSubId: string) {
  const { data } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', stripeSubId)
    .single()
  return data?.user_id ?? null
}
