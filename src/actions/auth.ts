'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { headers }        from 'next/headers'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────
// SIGN UP
// ─────────────────────────────────────────────────────────────
export async function signUpAction(formData: FormData) {
  const email    = (formData.get('email')    as string).trim().toLowerCase()
  const password =  formData.get('password') as string
  const name     = (formData.get('name')     as string | null)?.trim() ?? ''

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data:             { name },
      emailRedirectTo:  `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email to confirm your account.' }
}

// ─────────────────────────────────────────────────────────────
// SIGN IN
// ─────────────────────────────────────────────────────────────
export async function signInAction(formData: FormData) {
  const email    = (formData.get('email')    as string).trim().toLowerCase()
  const password =  formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string | null

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Incorrect email or password.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please confirm your email before signing in.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo ?? '/dashboard')
}

// ─────────────────────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────────────────────
export async function signOutAction() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────
export async function updateProfileAction(formData: FormData) {
  const name = (formData.get('name') as string).trim()

  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated.' }
  }

  const { error } = await supabase
    .from('users')
    .update({ name })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/account/settings')
  return { success: 'Profile updated.' }
}

// ─────────────────────────────────────────────────────────────
// UPDATE PASSWORD
// ─────────────────────────────────────────────────────────────
export async function updatePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword     = formData.get('newPassword')     as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }
  if (newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password updated successfully.' }
}

// ─────────────────────────────────────────────────────────────
// AUTH CALLBACK (OAuth / Email Confirm redirect handler)
// ─────────────────────────────────────────────────────────────
export async function exchangeCodeForSession(code: string) {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return { error: error.message }
  }
  return { success: true }
}
