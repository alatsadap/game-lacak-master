import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql, type Tracking } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  return session?.value === 'authenticated'
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAuth()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const result = await sql`
      SELECT * FROM tracking WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: result[0] as Tracking })
  } catch (error) {
    console.error('Error fetching tracking detail:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAuth()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { latitude, longitude, city, province, country, status_lokasi } = body

    const result = await sql`
      UPDATE tracking 
      SET 
        latitude = COALESCE(${latitude}, latitude),
        longitude = COALESCE(${longitude}, longitude),
        city = COALESCE(${city}, city),
        province = COALESCE(${province}, province),
        country = COALESCE(${country}, country),
        status_lokasi = COALESCE(${status_lokasi}, status_lokasi)
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: result[0] as Tracking })
  } catch (error) {
    console.error('Error updating tracking:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui data' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAuth()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { action } = await request.json()

    if (action === 'generate_password') {
      const plainPassword = generatePassword()
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      const result = await sql`
        UPDATE tracking 
        SET password_hash = ${hashedPassword}, password_plain = ${plainPassword}
        WHERE id = ${id}
        RETURNING *
      `

      if (result.length === 0) {
        return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
      }

      return NextResponse.json({ 
        data: result[0] as Tracking,
        password: plainPassword 
      })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Error processing action:', error)
    return NextResponse.json(
      { error: 'Gagal memproses aksi' },
      { status: 500 }
    )
  }
}
