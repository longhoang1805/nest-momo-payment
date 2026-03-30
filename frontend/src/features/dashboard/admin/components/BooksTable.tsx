import { useState, useMemo, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Plus, Star } from 'lucide-react'
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
import { SortableTh } from './SortableTh'
import { Pagination } from './Pagination'
import { PriceRangeSlider } from './PriceRangeSlider'
import { BookFormModal } from './BookFormModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { PAGE_SIZE, fmt, type Book, type SortDir } from '../types'

// Unique genres derived from the book list
function useGenres(books: Book[]) {
  return useMemo(() => {
    const set = new Set(books.map((b) => b.genre).filter(Boolean))
    return Array.from(set).sort()
  }, [books])
}

export function BooksTable({ books, openCreate, onCreateClose }: {
  books: Book[]
  openCreate?: boolean
  onCreateClose?: () => void
}) {
  const queryClient = useQueryClient()

  // ── filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [sortCol, setSortCol] = useState('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  const maxPrice = useMemo(() => {
    if (!books.length) return 500000
    return Math.ceil(Math.max(...books.map((b) => b.price)) / 50000) * 50000
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initialized = useRef(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice])
  useEffect(() => {
    if (!initialized.current && maxPrice > 0) {
      setPriceRange([0, maxPrice])
      initialized.current = true
    }
  }, [maxPrice])

  const genres = useGenres(books)

  // ── modal state ───────────────────────────────────────────────────────────
  const [formBook, setFormBook] = useState<Book | null | undefined>(undefined) // undefined = closed, null = create, Book = edit
  const [deleteBook, setDeleteBook] = useState<Book | null>(null)

  // Open create modal when parent signals it
  useEffect(() => {
    if (openCreate) setFormBook(null)
  }, [openCreate])

  // ── mutations ─────────────────────────────────────────────────────────────
  function closeFormModal() {
    setFormBook(undefined)
    onCreateClose?.()
  }

  const createMutation = useMutation({
    mutationFn: (data: Partial<Book>) => api.post('/admin/books', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'books'] })
      closeFormModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Book> }) =>
      api.patch(`/admin/books/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'books'] })
      closeFormModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'books'] })
      setDeleteBook(null)
    },
  })

  // ── sort ──────────────────────────────────────────────────────────────────
  function handleSort(col: string) {
    if (col === sortCol) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  // ── filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...books]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
      )
    }
    if (filterGenre) result = result.filter((b) => b.genre === filterGenre)
    result = result.filter((b) => b.price >= priceRange[0] && b.price <= priceRange[1])
    result.sort((a, b) => {
      let av: any = a[sortCol as keyof Book]
      let bv: any = b[sortCol as keyof Book]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [books, search, filterGenre, sortCol, sortDir, priceRange])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const isPriceFiltered = priceRange[0] > 0 || priceRange[1] < maxPrice
  const hasFilters = search || filterGenre || isPriceFiltered

  function resetFilters() {
    setSearch(''); setFilterGenre(''); setPriceRange([0, maxPrice]); setPage(1)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <>
      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-slate-100 space-y-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-52">
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Search by title / author</label>
            <Input
              placeholder="e.g. Dune or Herbert"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Genre</label>
            <select
              value={filterGenre}
              onChange={(e) => { setFilterGenre(e.target.value); setPage(1) }}
              className="h-9 text-sm border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-sm text-muted-foreground self-end" onClick={resetFilters}>
              Clear all
            </Button>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 mb-3 block">Price range</label>
          <div className="px-2">
            <PriceRangeSlider
              min={0}
              max={maxPrice}
              value={priceRange}
              step={5000}
              onChange={(v) => { setPriceRange(v); setPage(1) }}
            />
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <SortableTh col="id" label="ID" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <TableHead className="font-semibold text-slate-600 text-sm w-14">Cover</TableHead>
            <SortableTh col="title" label="Title" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="author" label="Author" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="genre" label="Genre" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="price" label="Price" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="stock" label="Stock" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <SortableTh col="rating" label="Rating" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <TableHead className="font-semibold text-slate-600 text-sm text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-14 text-muted-foreground text-sm">
                No books found.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((b) => (
              <TableRow key={b.id} className="hover:bg-slate-50/50">
                <TableCell className="text-slate-400 text-sm">#{b.id}</TableCell>
                <TableCell>
                  <div className="h-12 w-8 rounded overflow-hidden bg-slate-100 shrink-0">
                    {b.coverImage ? (
                      <img src={b.coverImage} alt={b.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-slate-200" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-slate-700 text-sm max-w-48 truncate">{b.title}</TableCell>
                <TableCell className="text-slate-500 text-sm whitespace-nowrap">{b.author}</TableCell>
                <TableCell>
                  {b.genre && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                      {b.genre}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-slate-700 text-sm whitespace-nowrap">{fmt(b.price)}</TableCell>
                <TableCell className="text-slate-500 text-sm">{b.stock}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-sm text-amber-600 font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {Number(b.rating).toFixed(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-slate-700"
                      onClick={() => setFormBook(b)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => setDeleteBook(b)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {formBook !== undefined && (
        <BookFormModal
          book={formBook}
          isSaving={isSaving}
          onClose={closeFormModal}
          onSave={(data) => {
            if (formBook === null) {
              createMutation.mutate(data)
            } else {
              updateMutation.mutate({ id: formBook.id, data })
            }
          }}
        />
      )}

      {deleteBook && (
        <DeleteConfirmModal
          bookTitle={deleteBook.title}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setDeleteBook(null)}
          onConfirm={() => deleteMutation.mutate(deleteBook.id)}
        />
      )}
    </>
  )
}
