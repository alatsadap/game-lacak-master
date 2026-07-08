'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Key, MapPin, Save, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react'
import type { Tracking } from '@/lib/db'

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

function StatusLokasiBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'gagal': 'bg-red-100 text-red-800',
    'Lokasi Didapatkan': 'bg-green-100 text-green-800'
  }
  const labels: Record<string, string> = {
    'pending': 'Menunggu',
    'gagal': 'Gagal',
    'Lokasi Didapatkan': 'Berhasil'
  }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}

function parseGoogleMapsLink(url: string): { lat: number; lng: number } | null {
  try {
    // Format: https://www.google.com/maps/search/?api=1&query=-7.64790925,111.495632
    const queryMatch = url.match(/query=([-\d.]+),([-\d.]+)/)
    if (queryMatch) {
      return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) }
    }
    
    // Format: https://www.google.com/maps?q=-7.64790925,111.495632
    const qMatch = url.match(/[?&]q=([-\d.]+),([-\d.]+)/)
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
    }

    // Format: https://www.google.com/maps/@-7.64790925,111.495632,15z
    const atMatch = url.match(/@([-\d.]+),([-\d.]+)/)
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
    }

    // Format with place: https://www.google.com/maps/place/.../@-7.64790925,111.495632
    const placeMatch = url.match(/place\/[^/]+\/@([-\d.]+),([-\d.]+)/)
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) }
    }

    return null
  } catch {
    return null
  }
}

export default function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<Tracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [copiedPassword, setCopiedPassword] = useState(false)

  // Edit form state
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [country, setCountry] = useState('')
  const [googleMapsLink, setGoogleMapsLink] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/tracking/${id}`)
        if (res.status === 401) {
          router.push('/admin')
          return
        }
        if (!res.ok) {
          throw new Error('Gagal mengambil data')
        }
        const json = await res.json()
        setData(json.data)
        
        // Set form values
        if (json.data.latitude) setLatitude(json.data.latitude.toString())
        if (json.data.longitude) setLongitude(json.data.longitude.toString())
        if (json.data.city) setCity(json.data.city)
        if (json.data.province) setProvince(json.data.province)
        if (json.data.country) setCountry(json.data.country)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, router])

  const handleGoogleMapsChange = (value: string) => {
    setGoogleMapsLink(value)
    const coords = parseGoogleMapsLink(value)
    if (coords) {
      setLatitude(coords.lat.toString())
      setLongitude(coords.lng.toString())
      setMessage('Koordinat berhasil diekstrak dari link Google Maps')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`/api/admin/tracking/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          city: city || null,
          province: province || null,
          country: country || null,
          status_lokasi: latitude && longitude ? 'Lokasi Didapatkan' : data?.status_lokasi
        })
      })

      if (!res.ok) {
        throw new Error('Gagal menyimpan data')
      }

      const json = await res.json()
      setData(json.data)
      setMessage('Data berhasil disimpan')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePassword = async () => {
    setGenerating(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`/api/admin/tracking/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_password' })
      })

      if (!res.ok) {
        throw new Error('Gagal generate password')
      }

      const json = await res.json()
      setData(json.data)
      setMessage(`Password berhasil di-generate: ${json.password}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setGenerating(false)
    }
  }

  const copyPassword = async () => {
    if (data?.password_plain) {
      await navigator.clipboard.writeText(data.password_plain)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/30">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (error && !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button className="w-full mt-4" variant="outline" asChild>
              <Link href="/admin/dashboard">Kembali ke Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!data) return null

  const googleMapsUrl = data.latitude && data.longitude 
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
    : null

  const osmUrl = data.latitude && data.longitude
    ? `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}&zoom=15`
    : null

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Tracking</h1>
            <p className="text-muted-foreground">ID: {data.id}</p>
          </div>
        </div>

        {message && (
          <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Info Dasar */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nomor Target</Label>
                <p className="font-medium text-lg">{data.nomor_target}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status Link</Label>
                  <div className="mt-1"><StatusLinkBadge status={data.status_link} /></div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status Lokasi</Label>
                  <div className="mt-1"><StatusLokasiBadge status={data.status_lokasi} /></div>
                </div>
              </div>
              <Separator />
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
              {data.ip && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">IP Address</Label>
                    <p className="font-mono text-sm">{data.ip}</p>
                  </div>
                </>
              )}
              {data.user_agent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="text-xs text-muted-foreground break-all">{data.user_agent}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password View
              </CardTitle>
              <CardDescription>
                Password untuk mengakses halaman view
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.password_plain ? (
                <div className="space-y-2">
                  <Label>Password (Plain)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={data.password_plain} 
                      className="font-mono text-lg tracking-wider"
                    />
                    <Button variant="outline" size="icon" onClick={copyPassword}>
                      {copiedPassword ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password sudah di-hash dan disimpan dengan aman
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">Password belum dibuat</p>
                  <Button onClick={handleGeneratePassword} disabled={generating}>
                    <Key className="mr-2 h-4 w-4" />
                    {generating ? 'Generating...' : 'Generate Password'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Lokasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Edit Lokasi
            </CardTitle>
            <CardDescription>
              Edit koordinat lokasi secara manual atau paste link Google Maps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="googleMapsLink">Link Google Maps (Opsional)</Label>
              <Input
                id="googleMapsLink"
                placeholder="Paste link Google Maps untuk auto-extract koordinat..."
                value={googleMapsLink}
                onChange={(e) => handleGoogleMapsChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Contoh: https://www.google.com/maps/search/?api=1&query=-7.64790925,111.495632
              </p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-7.64790925"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="111.495632"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input
                  id="city"
                  placeholder="Jakarta"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                <Input
                  id="province"
                  placeholder="DKI Jakarta"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Negara</Label>
                <Input
                  id="country"
                  placeholder="Indonesia"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </CardContent>
        </Card>

        {/* Map Preview */}
        {data.latitude && data.longitude && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Lokasi</CardTitle>
              <CardDescription>
                Koordinat: {data.latitude}, {data.longitude}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex flex-wrap gap-2">
                {googleMapsUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Buka di Google Maps
                    </a>
                  </Button>
                )}
                {osmUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={osmUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Buka di OpenStreetMap
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
