'use server'

import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * Server action to purge stale Next.js data cache and revalidate router path.
 * @param {string} tag - Cache tag to invalidate (e.g. 'academic-years', 'departments', 'classes')
 * @param {string} [path] - Optional path to revalidate (e.g. '/admin/tahun-ajaran')
 */
export async function revalidateCacheAction(tag, path) {
  try {
    if (tag) {
      revalidateTag(tag)
    }
    if (path) {
      revalidatePath(path, 'page')
    }
  } catch (err) {
    console.error('Error revalidating cache:', err)
  }
}
