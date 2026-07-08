import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sql, type Tracking } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const headersList = await headers()
    
    // Get IP address
    const forwardedFor = headersList.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headersList.get('x-real-ip') || 'unknown'
    
    // Get user agent
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Get body data (location)
    const body = await request.json().catch(() => ({}))
    const { latitude, longitude, locationStatus } = body

    // Check if tracking exists
    const existing = await sql`SELECT * FROM tracking WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tracking tidak ditemukan' }, { status: 404 })
    }

    const tracking = existing[0] as Tracking

    // Check if expired
    if (new Date(tracking.expired_at) < new Date()) {
      await sql`UPDATE tracking SET status_link = 'expired' WHERE id = ${id}`
      return NextResponse.json({ error: 'Link sudah kadaluarsa' }, { status: 410 })
    }

    // Update tracking data
    if (latitude && longitude) {
      await sql`
        UPDATE tracking 
        SET 
          ip = ${ip},
          user_agent = ${userAgent},
          latitude = ${latitude},
          longitude = ${longitude},
          status_link = 'opened',
          status_lokasi = 'Lokasi Didapatkan'
        WHERE id = ${id}
      `
    } else if (locationStatus === 'gagal') {
      await sql`
        UPDATE tracking 
        SET 
          ip = ${ip},
          user_agent = ${userAgent},
          status_link = 'opened',
          status_lokasi = 'gagal'
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE tracking 
        SET 
          ip = ${ip},
          user_agent = ${userAgent},
          status_link = 'opened'
        WHERE id = ${id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating visit:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui data' },
      { status: 500 }
    )
  }
}
