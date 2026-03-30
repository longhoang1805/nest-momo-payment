import { useState, useMemo } from 'react'
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
import { PAGE_SIZE, type SortDir } from '../types'

export function UsersTable({ users }: { users: any[] }) {
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
