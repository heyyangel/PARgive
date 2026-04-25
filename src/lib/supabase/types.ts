/**
 * Auto-generated TypeScript types derived from the Supabase schema.
 * Regenerate by running: npx supabase gen types typescript --local > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
export type SubscriptionPlan   = 'free' | 'basic' | 'premium'
export type DrawStatus         = 'upcoming' | 'open' | 'closed' | 'published'
export type MatchTier          = 'tier_3' | 'tier_4' | 'tier_5' | 'jackpot'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type PayoutStatus       = 'pending' | 'processing' | 'paid' | 'failed'

// ─────────────────────────────────────────────────────────────
// TABLE ROWS
// ─────────────────────────────────────────────────────────────
export interface UserRow {
  id:                  string
  email:               string
  name:                string | null
  subscription_status: SubscriptionStatus
  subscription_plan:   SubscriptionPlan
  subscription_start:  string | null
  charity_id:          string | null
  charity_percentage:  number
  created_at:          string
  updated_at:          string
}

export interface ScoreRow {
  id:          string
  user_id:     string
  score_value: number
  score_date:  string
  created_at:  string
}

export interface CharityRow {
  id:              string
  name:            string
  description:     string | null
  image_url:       string | null
  is_featured:     boolean
  upcoming_events: Json
  created_at:      string
  updated_at:      string
}

export interface DrawRow {
  id:           string
  month:        number
  year:         number
  draw_numbers: number[]
  status:       DrawStatus
  published_at: string | null
  created_at:   string
  updated_at:   string
}

export interface DrawEntryRow {
  id:              string
  draw_id:         string
  user_id:         string
  matched_numbers: number[]
  match_tier:      MatchTier | null
  created_at:      string
}

export interface PrizePoolRow {
  id:            string
  draw_id:       string
  tier_3_amount: number
  tier_4_amount: number
  tier_5_amount: number
  jackpot_carry: number
  created_at:    string
  updated_at:    string
}

export interface WinnerRow {
  id:                  string
  draw_id:             string
  user_id:             string
  tier:                MatchTier
  amount:              number
  proof_url:           string | null
  verification_status: VerificationStatus
  payout_status:       PayoutStatus
  created_at:          string
  updated_at:          string
}

export interface SubscriptionRow {
  id:                     string
  user_id:                string
  stripe_subscription_id: string | null
  plan:                   SubscriptionPlan
  status:                 SubscriptionStatus
  renewal_date:           string | null
  created_at:             string
  updated_at:             string
}

// ─────────────────────────────────────────────────────────────
// INSERT / UPDATE TYPES
// ─────────────────────────────────────────────────────────────
export type UserInsert         = Omit<UserRow, 'created_at' | 'updated_at'>
export type ScoreInsert        = Omit<ScoreRow, 'id' | 'created_at'>
export type CharityInsert      = Omit<CharityRow, 'id' | 'created_at' | 'updated_at'>
export type DrawInsert         = Omit<DrawRow, 'id' | 'created_at' | 'updated_at'>
export type DrawEntryInsert    = Omit<DrawEntryRow, 'id' | 'created_at'>
export type PrizePoolInsert    = Omit<PrizePoolRow, 'id' | 'created_at' | 'updated_at'>
export type WinnerInsert       = Omit<WinnerRow, 'id' | 'created_at' | 'updated_at'>
export type SubscriptionInsert = Omit<SubscriptionRow, 'id' | 'created_at' | 'updated_at'>

// ─────────────────────────────────────────────────────────────
// DATABASE INTERFACE (for createClient<Database>)
// Must match the shape expected by @supabase/supabase-js v2:
//   { Row, Insert, Update, Relationships }
// Missing Relationships causes all query types to collapse to `never`.
// ─────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      users: {
        Row:           UserRow
        Insert:        UserInsert & Partial<Pick<UserRow, 'created_at' | 'updated_at'>>
        Update:        Partial<UserRow>
        Relationships: any[]
      }
      scores: {
        Row:           ScoreRow
        Insert:        ScoreInsert & Partial<Pick<ScoreRow, 'id' | 'created_at'>>
        Update:        Partial<ScoreRow>
        Relationships: any[]
      }
      charities: {
        Row:           CharityRow
        Insert:        CharityInsert & Partial<Pick<CharityRow, 'id' | 'created_at' | 'updated_at'>>
        Update:        Partial<CharityRow>
        Relationships: any[]
      }
      draws: {
        Row:           DrawRow
        Insert:        DrawInsert & Partial<Pick<DrawRow, 'id' | 'created_at' | 'updated_at'>>
        Update:        Partial<DrawRow>
        Relationships: any[]
      }
      draw_entries: {
        Row:           DrawEntryRow
        Insert:        DrawEntryInsert & Partial<Pick<DrawEntryRow, 'id' | 'created_at'>>
        Update:        Partial<DrawEntryRow>
        Relationships: any[]
      }
      prize_pools: {
        Row:           PrizePoolRow
        Insert:        PrizePoolInsert & Partial<Pick<PrizePoolRow, 'id' | 'created_at' | 'updated_at'>>
        Update:        Partial<PrizePoolRow>
        Relationships: any[]
      }
      winners: {
        Row:           WinnerRow
        Insert:        WinnerInsert & Partial<Pick<WinnerRow, 'id' | 'created_at' | 'updated_at'>>
        Update:        Partial<WinnerRow>
        Relationships: any[]
      }
      subscriptions: {
        Row:           SubscriptionRow
        Insert:        SubscriptionInsert & Partial<Pick<SubscriptionRow, 'id' | 'created_at' | 'updated_at'>>
        Update:        Partial<SubscriptionRow>
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args:    Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      subscription_status_enum:  SubscriptionStatus
      subscription_plan_enum:    SubscriptionPlan
      draw_status_enum:          DrawStatus
      match_tier_enum:           MatchTier
      verification_status_enum:  VerificationStatus
      payout_status_enum:        PayoutStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

