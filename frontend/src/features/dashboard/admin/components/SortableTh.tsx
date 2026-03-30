import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import type { SortDir } from '../types'

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: SortDir }) {
  if (col !== sortCol) return <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-slate-400" />
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1 text-primary" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1 text-primary" />
  )
}

export function SortableTh({
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
