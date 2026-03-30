export type Tab = 'users' | 'orders'
export type SortDir = 'asc' | 'desc'

export const PAGE_SIZE = 10

export const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'
