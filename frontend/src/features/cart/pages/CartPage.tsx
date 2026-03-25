import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { useCartContext } from '@/contexts/cart.context'

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

export function CartPage() {
  const queryClient = useQueryClient()
  const { setCartCount, cartRefreshKey } = useCartContext()

  const { data, isLoading } = useQuery({
    queryKey: ['cart', cartRefreshKey],
    queryFn: () => api.get('/cart').then((r) => r.data.data),
  })

  const cart = data ?? { items: [], total: 0 }

  useEffect(() => {
    setCartCount(cart.items.length)
  }, [cart.items.length, setCartCount])

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      api.patch(`/cart/${itemId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => api.delete(`/cart/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <ShoppingBag className="h-20 w-20 text-muted-foreground/30" />
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground mt-1">Add some books to get started</p>
        </div>
        <Link to="/books">
          <Button className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Browse Books
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cart items */}
      <div className="lg:col-span-2 space-y-3">
        <h1 className="text-2xl font-bold">Shopping Cart ({cart.items.length})</h1>

        {cart.items.map((item: any) => (
          <Card key={item.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Cover */}
                <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {item.book?.coverImage ? (
                    <img
                      src={item.book.coverImage}
                      alt={item.book?.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          'https://placehold.co/64x80/e2e8f0/64748b?text=Book'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                    {item.book?.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.book?.author}</p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {formatPrice(item.book?.price ?? 0)}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-end justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMutation.mutate(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-xs font-semibold">
                    {formatPrice((item.book?.price ?? 0) * item.quantity)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order summary */}
      <div>
        <Card className="border-0 shadow-sm sticky top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-2 flex-1">
                  {item.book?.title} × {item.quantity}
                </span>
                <span className="font-medium shrink-0">
                  {formatPrice((item.book?.price ?? 0) * item.quantity)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatPrice(cart.total)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/checkout" className="w-full">
              <Button className="w-full gap-2">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
