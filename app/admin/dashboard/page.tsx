'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, LogOut, RefreshCw, Eye, MapPin, Home } from 'lucide-react'
import type { Tracking } from '@/lib/db'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
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

export default function AdminDashboardPage() {
  useEffect(() => {
    document.title = 'Dashboard Admin'
  }, [])

  const router = useRouter()
  const [data, setData] = useState<Tracking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tracking')
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      if (!res.ok) {
        throw new Error('Gagal mengambil data')
      }
      const json = await res.json()
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin')
  }

  const handleExport = () => {
    window.location.href = '/api/admin/export'
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Dashboard Admin
            </h1>
            <p className="text-muted-foreground">Kelola semua data tracking</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Beranda
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Tracking</CardTitle>
            <CardDescription>
              Total {data.length} data tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-destructive text-center py-8">{error}</p>
            ) : loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Memuat data...</p>
              </div>
            ) : data.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Belum ada data tracking</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor Target</TableHead>
                      <TableHead>Status Link</TableHead>
                      <TableHead>Status Lokasi</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nomor_target}</TableCell>
                        <TableCell><StatusLinkBadge status={item.status_link} /></TableCell>
                        <TableCell><StatusLokasiBadge status={item.status_lokasi} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(item.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/${item.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
