import type { Metadata } from 'next'
import { redirect }      from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import ProfileForm       from '@/components/account/ProfileForm'
import PasswordForm      from '@/components/account/PasswordForm'
import SubscriptionPanel from '@/components/account/SubscriptionPanel'

export const metadata: Metadata = {
  title: 'Account Settings — PARgive',
  description: 'Manage your profile, password, and subscription.',
}

export default async function AccountSettingsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, subscription_status, subscription_plan, subscription_start, charity_percentage')
    .eq('id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, renewal_date, stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-[#050508]">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(109,40,217,0.1) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-white/40 text-sm mt-1">{user.email}</p>
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <section className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
            <h2 className="text-base font-semibold text-white mb-1">Profile</h2>
            <p className="text-white/40 text-sm mb-6">Update your display name.</p>
            <ProfileForm initialName={profile?.name ?? ''} />
          </section>

          {/* Password */}
          <section className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
            <h2 className="text-base font-semibold text-white mb-1">Password</h2>
            <p className="text-white/40 text-sm mb-6">Change your login password.</p>
            <PasswordForm />
          </section>

          {/* Subscription */}
          <section className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
            <h2 className="text-base font-semibold text-white mb-1">Subscription</h2>
            <p className="text-white/40 text-sm mb-6">Manage your plan and billing.</p>
            <SubscriptionPanel
              subscription={subscription}
              hasStripeId={!!subscription?.stripe_subscription_id}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
