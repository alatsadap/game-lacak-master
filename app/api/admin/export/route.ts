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
      SELECT id, nomor_target, ip, user_agent, latitude, longitude, city, province, country, status_link, status_lokasi, created_at
      FROM tracking
      ORDER BY created_at DESC
    `

    const data = result as unknown as Tracking[]

    // Generate CSV
    const headers = ['ID', 'Nomor Target', 'IP', 'User Agent', 'Latitude', 'Longitude', 'City', 'Province', 'Country', 'Status Link', 'Status Lokasi', 'Created At']
    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        `"${row.nomor_target}"`,
        row.ip || '',
        `"${(row.user_agent || '').replace(/"/g, '""')}"`,
        row.latitude || '',
        row.longitude || '',
        row.city || '',
        row.province || '',
        row.country || '',
        row.status_link,
        row.status_lokasi,
        row.created_at
      ].join(','))
    ]
    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tracking_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Gagal mengekspor data' },
      { status: 500 }
    )
  }
}
