import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await sql`
      SELECT nomor_target, status_link, status_lokasi, created_at, expired_at
      FROM tracking
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    }

    const row = result[0]
    return NextResponse.json({
      nomor_target: row.nomor_target,
      status_link: row.status_link,
      status_lokasi: row.status_lokasi,
      created_at: row.created_at,
      expired_at: row.expired_at
    })
  } catch (error) {
    console.error('Error fetching preview:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}
