import { NextResponse } from 'next/server'
import { sql, type Tracking } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    const { nomor_target } = await request.json()

    if (!nomor_target || typeof nomor_target !== 'string') {
      return NextResponse.json(
        { error: 'Nomor target wajib diisi' },
        { status: 400 }
      )
    }

    const id = nanoid(21)

    try {
      const result = await sql`
        INSERT INTO tracking (id, nomor_target)
        VALUES (${id}, ${nomor_target})
        RETURNING *
      `

      if (!result || result.length === 0) {
        throw new Error('No result returned from INSERT')
      }

      const tracking = result[0] as unknown as Tracking

      return NextResponse.json({
        success: true,
        data: {
          id: tracking.id,
          linkTarget: `/t/${tracking.id}`,
          linkView: `/view/${tracking.id}`
        }
      })
    } catch (dbError) {
      console.error('Database error details:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any)?.code,
        detail: (dbError as any)?.detail
      })
      throw dbError
    }
  } catch (error) {
    console.error('Error creating tracking:', error)
    return NextResponse.json(
      { error: 'Gagal membuat tracking nomor target' },
      { status: 500 }
    )
  }
}
