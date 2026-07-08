import { NextResponse } from 'next/server'
import { sql, type Tracking } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  if (now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return false
  }
  
  record.count++
  record.lastAttempt = now
  return true
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' },
        { status: 429 }
      )
    }

    const { id, password } = await request.json()

    if (!id || !password) {
      return NextResponse.json(
        { error: 'ID dan password wajib diisi' },
        { status: 400 }
      )
    }

    const result = await sql`SELECT * FROM tracking WHERE id = ${id}`
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan' },
        { status: 404 }
      )
    }

    const tracking = result[0] as Tracking

    if (!tracking.password_hash) {
      return NextResponse.json(
        { error: 'Password belum di-generate. Hubungi admin.' },
        { status: 400 }
      )
    }

    const isMatch = await bcrypt.compare(password, tracking.password_hash)

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      )
    }

    // Return tracking data without sensitive fields
    const safeData = {
      id: tracking.id,
      nomor_target: tracking.nomor_target,
      ip: tracking.ip,
      user_agent: tracking.user_agent,
      latitude: tracking.latitude,
      longitude: tracking.longitude,
      city: tracking.city,
      province: tracking.province,
      country: tracking.country,
      status_link: tracking.status_link,
      status_lokasi: tracking.status_lokasi,
      created_at: tracking.created_at,
      expired_at: tracking.expired_at
    }

    return NextResponse.json({ success: true, data: safeData })
  } catch (error) {
    console.error('Error unlocking data:', error)
    return NextResponse.json(
      { error: 'Gagal memverifikasi password' },
      { status: 500 }
    )
  }
}
