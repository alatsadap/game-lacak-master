import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_PASSWORD = 'didbraga01'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      )
    }

    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({ success: true, message: 'Login berhasil' })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  return NextResponse.json({ success: true })
}
