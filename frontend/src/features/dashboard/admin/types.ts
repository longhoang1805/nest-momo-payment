export type Tab = 'users' | 'orders' | 'books'

export interface Book {
  id: number
  title: string
  author: string
  price: number
  description: string
  coverImage: string
  genre: string
  stock: number
  rating: number
  createdAt: string
  updatedAt: string
}
export type SortDir = 'asc' | 'desc'

export const PAGE_SIZE = 10

export const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'
