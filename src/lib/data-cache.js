import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Get all departments (cached in memory)
 */
export const getCachedDepartments = cache(
  async () => {
    const supabase = getAnonClient()
    const { data } = await supabase
      .from('departments')
      .select('id, name, description, created_at')
      .order('name', { ascending: true })
    return data || []
  },
  ['departments-list'],
  { tags: ['departments'], revalidate: 3600 }
)

/**
 * Get all academic years (cached in memory)
 */
export const getCachedAcademicYears = cache(
  async () => {
    const supabase = getAnonClient()
    const { data } = await supabase
      .from('academic_years')
      .select('id, name, start_date, end_date, is_active, created_at')
      .order('name', { ascending: false })
    return data || []
  },
  ['academic-years-list'],
  { tags: ['academic-years'], revalidate: 3600 }
)

/**
 * Get active academic year (cached in memory)
 */
export const getCachedActiveAcademicYear = cache(
  async () => {
    const years = await getCachedAcademicYears()
    return years.find(y => y.is_active) || null
  },
  ['active-academic-year'],
  { tags: ['academic-years'], revalidate: 3600 }
)

/**
 * Revalidate data cache tags on mutation
 */
export function revalidateDataCache(tag) {
  try {
    revalidateTag(tag)
  } catch (e) {
    // Ignore outside server action context
  }
}
