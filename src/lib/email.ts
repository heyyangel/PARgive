/**
 * Email service using Resend.
 * All email templates are plain-function HTML builders — no React Email dependency needed.
 */
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build_only')

const FROM      = process.env.EMAIL_FROM      ?? 'PARgive <noreply@pargive.app>'
const APP_NAME  = process.env.NEXT_PUBLIC_APP_NAME ?? 'PARgive'
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL  ?? 'http://localhost:3000'

// ─────────────────────────────────────────────────────────────
// SHARED TEMPLATE WRAPPER
// ─────────────────────────────────────────────────────────────
function wrap(body: string) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#050508; color:#e0e0e0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
  .container { max-width:560px; margin:0 auto; padding:40px 24px; }
  h1 { font-size:22px; color:#fff; margin:0 0 8px; }
  p  { font-size:14px; line-height:1.6; color:rgba(255,255,255,0.55); margin:0 0 16px; }
  .btn { display:inline-block; padding:12px 28px; border-radius:12px; font-size:14px; font-weight:700;
         color:#fff; background:linear-gradient(135deg,#7c3aed,#4f46e5); text-decoration:none; }
  .card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          border-radius:16px; padding:20px; margin:16px 0; }
  .stat { font-size:28px; font-weight:700; color:#fff; }
  .label { font-size:11px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.1em; }
  .footer { margin-top:32px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.06);
            font-size:11px; color:rgba(255,255,255,0.2); }
  .accent { color:#a78bfa; }
  .green  { color:#34d399; }
</style>
</head><body><div class="container">
${body}
<div class="footer">
  <p>${APP_NAME} · <a href="${APP_URL}" style="color:rgba(255,255,255,0.3)">${APP_URL}</a></p>
</div>
</div></body></html>`
}

// ─────────────────────────────────────────────────────────────
// 1. SUBSCRIPTION CONFIRMED
// ─────────────────────────────────────────────────────────────
export async function sendSubscriptionEmail(to: string, data: {
  name:      string
  plan:      string
  amount:    string
  renewDate: string
}) {
  const html = wrap(`
    <h1>Welcome to ${APP_NAME}, ${data.name}! 🎉</h1>
    <p>Your <strong class="accent">${data.plan}</strong> subscription is now active.</p>
    <div class="card">
      <div class="label">Plan</div>
      <div class="stat">${data.plan}</div>
      <p style="margin-top:8px">£${data.amount} · renews ${data.renewDate}</p>
    </div>
    <p>You're now entered into every monthly prize draw, and a portion of your subscription supports the charity you choose.</p>
    <p><a class="btn" href="${APP_URL}/dashboard">Go to your dashboard →</a></p>
  `)

  return resend.emails.send({ from: FROM, to, subject: `Welcome to ${APP_NAME} — subscription confirmed`, html })
}

// ─────────────────────────────────────────────────────────────
// 2. DRAW RESULTS
// ─────────────────────────────────────────────────────────────
export async function sendDrawResultsEmail(to: string, data: {
  name:           string
  month:          string
  drawnNumbers:   number[]
  matchedCount:   number
  matchedNumbers: number[]
  tier:           string | null
  prizeAmount?:   number
}) {
  const numbersHtml = data.drawnNumbers
    .map((n) => {
      const matched = data.matchedNumbers.includes(n)
      return `<span style="display:inline-block;width:40px;height:40px;line-height:40px;text-align:center;border-radius:50%;font-weight:700;font-size:16px;margin:4px;${matched ? 'background:#7c3aed;color:#fff;' : 'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);'}">${n}</span>`
    })
    .join('')

  const resultLine = data.tier
    ? `<p class="green" style="font-size:18px;font-weight:700">🏆 You matched ${data.matchedCount}! ${data.tier === 'jackpot' ? 'JACKPOT!' : `Tier: ${data.tier}`}</p>`
    : `<p>You matched ${data.matchedCount} number${data.matchedCount !== 1 ? 's' : ''} — no prize this month, but next month could be yours!</p>`

  const html = wrap(`
    <h1>${data.month} Draw Results</h1>
    <p>Hi ${data.name}, the ${data.month} draw numbers are in:</p>
    <div class="card" style="text-align:center">
      ${numbersHtml}
    </div>
    ${resultLine}
    ${data.prizeAmount ? `<div class="card"><div class="label">Your prize</div><div class="stat green">£${data.prizeAmount.toFixed(2)}</div></div>` : ''}
    <p><a class="btn" href="${APP_URL}/dashboard">View full results →</a></p>
  `)

  const subject = data.tier
    ? `🏆 You won in the ${data.month} draw!`
    : `${data.month} draw results — ${data.matchedCount} match${data.matchedCount !== 1 ? 'es' : ''}`

  return resend.emails.send({ from: FROM, to, subject, html })
}

// ─────────────────────────────────────────────────────────────
// 3. WINNER NOTIFICATION (detailed, separate from draw results)
// ─────────────────────────────────────────────────────────────
export async function sendWinnerEmail(to: string, data: {
  name:   string
  month:  string
  tier:   string
  amount: number
}) {
  const tierLabel = data.tier === 'jackpot' ? '🏆 Jackpot (5 match)' : data.tier === 'tier_4' ? '4 Match' : '3 Match'

  const html = wrap(`
    <h1>Congratulations, ${data.name}! 🎉</h1>
    <p>You're a verified winner in the <strong>${data.month}</strong> prize draw.</p>
    <div class="card">
      <div class="label">Tier</div>
      <div class="stat accent">${tierLabel}</div>
    </div>
    <div class="card">
      <div class="label">Prize amount</div>
      <div class="stat green">£${data.amount.toFixed(2)}</div>
      <p style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.3)">Payout will be processed and you'll receive confirmation once complete.</p>
    </div>
    <p><a class="btn" href="${APP_URL}/dashboard">View your winnings →</a></p>
  `)

  return resend.emails.send({ from: FROM, to, subject: `🏆 You won £${data.amount.toFixed(2)} — ${data.month} draw`, html })
}

// ─────────────────────────────────────────────────────────────
// 4. PAYMENT / DONATION CONFIRMATION
// ─────────────────────────────────────────────────────────────
export async function sendPaymentConfirmationEmail(to: string, data: {
  name:        string
  amount:      string
  description: string
  date:        string
}) {
  const html = wrap(`
    <h1>Payment confirmed ✓</h1>
    <p>Hi ${data.name}, here's your receipt:</p>
    <div class="card">
      <div class="label">Amount</div>
      <div class="stat">£${data.amount}</div>
      <p style="margin-top:8px">${data.description}</p>
      <p style="font-size:12px;color:rgba(255,255,255,0.3)">${data.date}</p>
    </div>
    <p>Thank you for your generosity. Every contribution counts. 💚</p>
    <p><a class="btn" href="${APP_URL}/dashboard">Back to dashboard →</a></p>
  `)

  return resend.emails.send({ from: FROM, to, subject: `Payment confirmed — £${data.amount}`, html })
}
