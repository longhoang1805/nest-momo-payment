import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, ShoppingCart, Package, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth.context'
import { api } from '@/lib/api'

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  paid: { label: 'Paid', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export function DashboardPage() {
  const { user } = useAuth()

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then((r) => r.data.data),
  })

  const { data: booksData } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books').then((r) => r.data.data),
  })

  const orders = ordersData ?? []
  const books = booksData ?? []
  const paidOrders = orders.filter((o: any) => o.status === 'paid')
  const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)

  const stats = [
    { label: 'Total Books', value: books.length, icon: BookOpen, color: 'text-blue-600' },
    { label: 'Your Orders', value: orders.length, icon: Package, color: 'text-purple-600' },
    { label: 'Completed', value: paidOrders.length, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Total Spent', value: formatPrice(totalSpent), icon: ShoppingCart, color: 'text-orange-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, <span className="text-primary">{user?.username}</span> 👋
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s a summary of your activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Browse Books
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Explore our curated collection of {books.length}+ books across all genres.
            </p>
            <Link to="/books">
              <Button className="w-full">View All Books</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet. Start shopping!</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 3).map((order: any) => {
                  const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending
                  return (
                    <div key={order.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Order #{order.id}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatPrice(order.totalAmount)}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
