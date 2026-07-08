import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql, type Tracking } from '@/lib/db'

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  return session?.value === 'authenticated'
}

export async function GET() {
  const isAuth = await checkAuth()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sql`
      SELECT id, nomor_target, status_link, status_lokasi, created_at, expired_at
      FROM tracking
      ORDER BY created_at DESC
    `

    return NextResponse.json({ data: result as unknown as Tracking[] })
  } catch (error) {
    console.error('Error fetching tracking list:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data' },
      { status: 500 }
    )
  }
}
