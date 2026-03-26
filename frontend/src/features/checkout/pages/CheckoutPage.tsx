import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, CreditCard, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { useCartContext } from '@/contexts/cart.context'
import { cn } from '@/lib/utils'
import momoLogo from '@/assets/momo-logo.png'
import zalopayLogo from '@/assets/zalopay-logo.png'

type PaymentMethod = 'momo' | 'zalopay'

const PAYMENT_METHODS: {
  id: PaymentMethod
  label: string
  description: string
  logoUrl: string
}[] = [
  {
    id: 'momo',
    label: 'MoMo',
    description: 'Scan QR code with MoMo app',
    logoUrl: momoLogo,
  },
  {
    id: 'zalopay',
    label: 'ZaloPay',
    description: 'Scan QR code with ZaloPay app',
    logoUrl: zalopayLogo,
  },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { refreshCart } = useCartContext()

  const [form, setForm] = useState({ firstName: '', lastName: '', address: '' })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart').then((r) => r.data.data),
  })

  const cart = cartData ?? { items: [], total: 0 }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/orders', form)
      const order = res.data.data
      refreshCart()
      navigate(`/payment/${order.id}?method=${paymentMethod}`)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create order'))
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button variant="link" onClick={() => navigate('/books')}>
          Go back to books
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cart')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-sm text-muted-foreground">Complete your order details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping form */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" id="checkout-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main St, City, Country"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Order summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate flex-1 mr-2">
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

            {/* Payment method selector */}
            <div className="pt-2 space-y-2">
              <p className="text-sm font-medium">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      'relative flex items-center gap-2 rounded-lg border p-3 text-left transition-all',
                      paymentMethod === method.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-slate-50 hover:border-primary/50',
                    )}
                  >
                    <img
                      src={method.logoUrl}
                      alt={method.label}
                      className="h-8 w-8 object-contain shrink-0"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{method.label}</p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {method.description}
                      </p>
                    </div>
                    {paymentMethod === method.id && (
                      <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              form="checkout-form"
              className="w-full gap-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {loading ? 'Creating Order...' : 'Place Order & Pay'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
