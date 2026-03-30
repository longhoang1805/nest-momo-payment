import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SortableTh } from './SortableTh'
import { Pagination } from './Pagination'
import { PriceRangeSlider } from './PriceRangeSlider'
import { PAGE_SIZE, STATUS_STYLES, fmt, type SortDir } from '../types'

export function OrdersTable({ orders, users }: { orders: any[]; users: any[] }) {
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
