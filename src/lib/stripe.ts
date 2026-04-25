/**
 * Stripe singleton client — server-side only.
 * Import this in API routes and server actions.
 * Never import in Client Components.
 */
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// ─── Plan configuration ───────────────────────────────────────
export const PLANS = {
  basic: {
    name:         'Monthly',
    description:  'Billed monthly. Cancel anytime.',
    priceId:      process.env.STRIPE_BASIC_PRICE_ID!,
    amount:       999,      // $9.99 in cents
    currency:     'usd',
    interval:     'month' as const,
    features: [
      'Access to all monthly draws',
      'Up to 5 score entries',
      'Choose your supported charity',
      'Real-time prize pool tracker',
      'Email draw notifications',
    ],
  },
  premium: {
    name:         'Yearly',
    description:  'Billed annually. Save 33%.',
    priceId:      process.env.STRIPE_PREMIUM_PRICE_ID!,
    amount:       7999,     // $79.99 in cents
    currency:     'usd',
    interval:     'year' as const,
    features: [
      'Everything in Monthly',
      'Priority draw entry',
      'Exclusive charity events access',
      'Early results access',
      'Annual bonus draw entry',
      'Dedicated support',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

/**
 * Get or create a Stripe customer for a user.
 * Idempotent — will return existing customer if already stored.
 */
export async function getOrCreateStripeCustomer({
  userId,
  email,
  name,
  existingCustomerId,
}: {
  userId:              string
  email:               string
  name?:               string | null
  existingCustomerId?: string | null
}): Promise<string> {
  if (existingCustomerId) {
    return existingCustomerId
  }

  const customer = await stripe.customers.create({
    email,
    name:     name ?? undefined,
    metadata: { supabase_user_id: userId },
  })

  return customer.id
}
