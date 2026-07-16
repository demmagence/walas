import { createClient } from './supabase/client'

/**
 * Signs in a user using email and password (client-side).
 * @param {string} email 
 * @param {string} password 
 */
export async function signIn(email, password) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/**
 * Signs out the current user (client-side) and refreshes the page.
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Gets the profile information of a user from the profiles table.
 * @param {string} userId 
 */
export async function getProfile(userId) {
  const supabase = createClient()
  const { data, error } = await supabase.from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}
