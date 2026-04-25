/**
 * Pure utility — contribution amount calculation.
 * Extracted from actions/charities.ts because 'use server' files
 * require all exports to be async server actions.
 */

const PLAN_AMOUNTS: Record<string, number> = {
  basic:   9.99,   // monthly
  premium: 79.99,  // yearly
  free:    0,
}

export function computeContributionAmount(
  plan:              string,
  charityPercentage: number
): { amount: number; period: string; planLabel: string } {
  const planAmount = PLAN_AMOUNTS[plan] ?? 0
  const amount     = parseFloat(((planAmount * charityPercentage) / 100).toFixed(2))
  const period     = plan === 'premium' ? 'year' : 'month'
  const planLabel  = plan === 'basic' ? 'Monthly' : plan === 'premium' ? 'Yearly' : 'Free'
  return { amount, period, planLabel }
}
