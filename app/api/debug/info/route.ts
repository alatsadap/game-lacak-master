import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    return NextResponse.json({
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL
      },
      cookies: {
        adminSession: adminSession ? 'exists' : 'missing',
        adminSessionValue: adminSession?.value || null
      },
      message: 'Debug info'
    }, {
      headers: {
        'Set-Cookie': 'debug=info; Path=/; Max-Age=3600'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
