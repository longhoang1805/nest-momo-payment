import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  ShoppingCart,
  LogOut,
  BookOpen,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

type Tab = 'users' | 'orders'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}


const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

// ─── Dual range slider ───────────────────────────────────────────────────────

function PriceRangeSlider({
  min,
  max,
  value,
  step = 10000,
  onChange,
}: {
  min: number
  max: number
  value: [number, number]
  step?: number
  onChange: (v: [number, number]) => void
}) {
  const [lo, hi] = value
  const range = max - min || 1
  const pctLo = ((lo - min) / range) * 100
  const pctHi = ((hi - min) / range) * 100

  return (
    <>
      <style>{`
        .price-slider {
          -webkit-appearance: none;
          appearance: none;
          position: absolute;
          width: 100%;
          height: 4px;
          background: transparent;
          pointer-events: none;
          outline: none;
        }
        .price-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: all;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: transform 0.1s;
        }
        .price-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .price-slider::-moz-range-thumb {
          pointer-events: all;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        }
      `}</style>
      <div className="relative w-full pt-2 pb-1">
        {/* Track */}
        <div className="relative h-1.5 w-full bg-slate-200 rounded-full">
          <div
            className="absolute h-full bg-primary rounded-full transition-all"
            style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
          />
        </div>
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi - step)
            onChange([v, hi])
          }}
          className="price-slider"
          style={{ zIndex: lo >= hi - step ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo + step)
            onChange([lo, v])
          }}
          className="price-slider"
          style={{ zIndex: 4 }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-1">
        <span className="text-sm font-medium text-primary">{fmt(lo)}</span>
        <span className="text-sm font-medium text-primary">{fmt(hi)}</span>
      </div>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: SortDir }) {
  if (col !== sortCol) return <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-slate-400" />
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1 text-primary" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1 text-primary" />
  )
}

function SortableTh({
  col,
  label,
  sortCol,
  sortDir,
  onSort,
}: {
  col: string
  label: string
  sortCol: string
  sortDir: SortDir
  onSort: (c: string) => void
}) {
  return (
    <TableHead
      className="font-semibold text-slate-600 text-sm cursor-pointer select-none whitespace-nowrap"
      onClick={() => onSort(col)}
    >
      {label}
      <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </TableHead>
  )
}

function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? '0 results'
          : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-sm">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className="h-7 w-7 text-xs"
                onClick={() => onChange(p as number)}
              >
                {p}
              </Button>
            ),
          )}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Users table ─────────────────────────────────────────────────────────────

function UsersTable({ users }: { users: any[] }) {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  function handleSort(col: string) {
    if (col === sortCol) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    let result = [...users]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((u) => u.username.toLowerCase().includes(q))
    }
    if (dateFrom) result = result.filter((u) => new Date(u.createdAt) >= new Date(dateFrom))
    if (dateTo) result = result.filter((u) => new Date(u.createdAt) <= new Date(dateTo + 'T23:59:59'))
    result.sort((a, b) => {
      let av = sortCol === 'createdAt' ? new Date(a.createdAt).getTime() : a[sortCol]
      let bv = sortCol === 'createdAt' ? new Date(b.createdAt).getTime() : b[sortCol]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [users, search, sortCol, sortDir, dateFrom, dateTo])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || dateFrom || dateTo

  function resetFilters() {
    setSearch(''); setDateFrom(''); setDateTo(''); setPage(1)
  }

  return (
    <>
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-50">
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Search by username</label>
            <Input
              placeholder="e.g. john"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">From date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="h-9 text-sm w-40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">To date</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="h-9 text-sm w-40"
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-sm text-muted-foreground" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <SortableTh col="id" label="ID" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="username" label="Username" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="createdAt" label="Created At" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-14 text-muted-foreground text-sm">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((u: any) => (
              <TableRow key={u.id} className="hover:bg-slate-50/50">
                <TableCell className="text-slate-400 text-sm">#{u.id}</TableCell>
                <TableCell className="font-medium text-slate-700 text-sm">{u.username}</TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </>
  )
}

// ─── Orders table ─────────────────────────────────────────────────────────────

function OrdersTable({ orders, users }: { orders: any[]; users: any[] }) {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)

  const maxOrderPrice = useMemo(() => {
    if (!orders.length) return 2000000
    return Math.ceil(Math.max(...orders.map((o) => o.totalAmount)) / 100000) * 100000
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initialized = useRef(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxOrderPrice])

  useEffect(() => {
    if (!initialized.current && maxOrderPrice > 0) {
      setPriceRange([0, maxOrderPrice])
      initialized.current = true
    }
  }, [maxOrderPrice])

  const userMap = useMemo(() => {
    const m: Record<number, string> = {}
    users.forEach((u) => { m[u.id] = u.username })
    return m
  }, [users])

  function handleSort(col: string) {
    if (col === sortCol) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    let result = [...orders]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((o) => (userMap[o.userId] ?? '').toLowerCase().includes(q))
    }
    if (filterStatus) result = result.filter((o) => o.status === filterStatus)
    result = result.filter((o) => o.totalAmount >= priceRange[0] && o.totalAmount <= priceRange[1])
    result.sort((a, b) => {
      let av: any, bv: any
      if (sortCol === 'username') { av = (userMap[a.userId] ?? '').toLowerCase(); bv = (userMap[b.userId] ?? '').toLowerCase() }
      else if (sortCol === 'total') { av = a.totalAmount; bv = b.totalAmount }
      else if (sortCol === 'createdAt') { av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime() }
      else { av = a[sortCol]; bv = b[sortCol] }
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [orders, search, sortCol, sortDir, filterStatus, priceRange, userMap])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const isPriceFiltered = priceRange[0] > 0 || priceRange[1] < maxOrderPrice
  const hasFilters = search || filterStatus || isPriceFiltered

  function resetFilters() {
    setSearch(''); setFilterStatus(''); setPriceRange([0, maxOrderPrice]); setPage(1)
  }

  return (
    <>
      <div className="px-6 py-5 border-b border-slate-100 space-y-5">
        {/* Row 1: search + status pills */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-50">
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Search by username</label>
            <Input
              placeholder="e.g. john"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
              className="h-9 text-sm border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-sm text-muted-foreground self-end" onClick={resetFilters}>
              Clear all
            </Button>
          )}
        </div>

        {/* Row 2: price range slider */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-3 block">Price range</label>
          <div className="px-2">
            <PriceRangeSlider
              min={0}
              max={maxOrderPrice}
              value={priceRange}
              step={10000}
              onChange={(v) => { setPriceRange(v); setPage(1) }}
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <SortableTh col="id" label="ID" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="userId" label="User ID" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="username" label="Username" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="total" label="Total" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="status" label="Status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="createdAt" label="Created At" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-14 text-muted-foreground text-sm">
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((o: any) => (
              <TableRow key={o.id} className="hover:bg-slate-50/50">
                <TableCell className="text-slate-400 text-sm">#{o.id}</TableCell>
                <TableCell className="text-slate-500 text-sm">#{o.userId}</TableCell>
                <TableCell className="font-medium text-slate-700 text-sm">{userMap[o.userId] ?? '—'}</TableCell>
                <TableCell className="font-medium text-slate-700 text-sm">{fmt(o.totalAmount)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {o.status}
                  </span>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const navigate = useNavigate()

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data.data),
  })

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => api.get('/admin/orders').then((r) => r.data.data),
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    navigate('/admin/login')
  }

  const totalRevenue = orders
    .filter((o: any) => o.status === 'paid')
    .reduce((sum: number, o: any) => sum + o.totalAmount, 0)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-200 bg-white shadow-sm">
          <SidebarHeader className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-bold leading-none">BookStore</p>
                <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Management
            </p>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'users'}
                  onClick={() => setActiveTab('users')}
                  className="rounded-lg text-sm"
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                  <span className="ml-auto text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                    {users.length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'orders'}
                  onClick={() => setActiveTab('orders')}
                  className="rounded-lg text-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Orders</span>
                  <span className="ml-auto text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                    {orders.length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="px-3 py-4 border-t border-slate-100">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-800">
              {activeTab === 'users' ? 'Users' : 'Orders'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="p-8">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">{users.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">{orders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Revenue (Paid)</p>
                  <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">{fmt(totalRevenue)}</p>
              </div>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-700">
                  {activeTab === 'users' ? 'All Users' : 'All Orders'}
                </h2>
              </div>

              {activeTab === 'users' &&
                (loadingUsers ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading...</div>
                ) : (
                  <UsersTable users={users} />
                ))}

              {activeTab === 'orders' &&
                (loadingOrders || loadingUsers ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading...</div>
                ) : (
                  <OrdersTable orders={orders} users={users} />
                ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
