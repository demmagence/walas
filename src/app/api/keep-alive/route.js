import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    // Light ping query to keep Supabase DB connection pool & Vercel serverless function warm
    await supabase.from('academic_years').select('id').limit(1)

    return NextResponse.json(
      {
        status: 'ok',
        warmed: true,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}
