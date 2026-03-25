import { useState } from 'react'
import { ShoppingCart, Star, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useCartContext } from '@/contexts/cart.context'

interface Book {
  id: number
  title: string
  author: string
  price: number
  description: string
  coverImage: string
  genre: string
  stock: number
  rating: number
}

interface BookCardProps {
  book: Book
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

export function BookCard({ book }: BookCardProps) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const { refreshCart } = useCartContext()

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      await api.post('/cart', { bookId: book.id, quantity: 1 })
      setAdded(true)
      refreshCart()
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full border-0 shadow-sm bg-white">
      {/* Cover image */}
      <div className="relative overflow-hidden bg-slate-100 aspect-[3/4]">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                `https://placehold.co/300x400/e2e8f0/64748b?text=${encodeURIComponent(book.title)}`
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center p-4">
              <span className="text-4xl">📚</span>
              <p className="mt-2 text-xs font-medium">{book.title}</p>
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs font-medium bg-white/90 backdrop-blur-sm">
            {book.genre}
          </Badge>
        </div>
      </div>

      <CardContent className="flex flex-col flex-1 p-4">
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground">{book.author}</p>

          <div className="flex items-center gap-1 pt-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium">{book.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-base font-bold text-primary">{formatPrice(book.price)}</p>
          <Button
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={handleAddToCart}
            disabled={adding || book.stock === 0}
            variant={added ? 'secondary' : 'default'}
          >
            {adding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5" />
            )}
            {added ? 'Added!' : book.stock === 0 ? 'Out of stock' : 'Add to Cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
