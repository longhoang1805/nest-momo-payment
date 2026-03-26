import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Smartphone,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import momoLogo from '@/assets/momo-logo.png'
import zalopayLogo from '@/assets/zalopay-logo.png'

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

type PaymentStatus = 'idle' | 'creating' | 'pending' | 'success' | 'failed'
type PaymentMethod = 'momo' | 'zalopay'

interface MomoPaymentData {
  payUrl: string
  qrCodeUrl: string
  momoOrderId: string
  amount: number
}

interface ZaloPayPaymentData {
  orderUrl: string
  qrCode?: string
  appTransId: string
  amount: number
}

const PROVIDER_CONFIG: Record<
  PaymentMethod,
  { label: string; color: string; logoUrl: string; instructions: string[] }
> = {
  momo: {
    label: 'MoMo',
    color: '#ae2070',
    logoUrl: momoLogo,
    instructions: [
      'Open the MoMo app on your phone',
      'Tap the QR scanner icon',
      'Scan the QR code above',
      'Confirm the payment in your app',
    ],
  },
  zalopay: {
    label: 'ZaloPay',
    color: '#0068ff',
    logoUrl: zalopayLogo,
    instructions: [
      'Open the ZaloPay app on your phone',
      'Tap the QR scanner icon',
      'Scan the QR code above',
      'Confirm the payment in your app',
    ],
  },
}

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const method = (searchParams.get('method') ?? 'momo') as PaymentMethod
  const provider = PROVIDER_CONFIG[method] ?? PROVIDER_CONFIG.momo

  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [momoData, setMomoData] = useState<MomoPaymentData | null>(null)
  const [zaloPayData, setZaloPayData] = useState<ZaloPayPaymentData | null>(null)
  const [pollCount, setPollCount] = useState(0)

  // Callback result params
  const callbackResultCode = searchParams.get('resultCode') // MoMo: '0' = success
  const callbackStatus = searchParams.get('status') // ZaloPay: '1' = success

  const { data: orderData, refetch: refetchOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`).then((r) => r.data.data),
    enabled: !!orderId,
  })

  const order = orderData

  // Handle MoMo callback redirect
  useEffect(() => {
    if (callbackResultCode === '0') {
      setStatus('success')
      refetchOrder()
    } else if (callbackResultCode && callbackResultCode !== '0') {
      setStatus('failed')
    }
  }, [callbackResultCode, refetchOrder])

  // Handle ZaloPay redirect callback
  useEffect(() => {
    if (callbackStatus === '1') {
      setStatus('success')
      refetchOrder()
    } else if (callbackStatus && callbackStatus !== '1') {
      setStatus('failed')
    }
  }, [callbackStatus, refetchOrder])

  // Check if order is already paid on load
  useEffect(() => {
    if (order?.status === 'paid') setStatus('success')
  }, [order?.status])

  // Poll for payment status while pending
  useEffect(() => {
    if (status !== 'pending') return
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${orderId}`)
        if (res.data.data.status === 'paid') {
          setStatus('success')
          clearInterval(interval)
        }
      } catch {
        // ignore poll errors
      }
      setPollCount((c) => c + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [status, orderId])

  const createMomoPaymentMutation = useMutation({
    mutationFn: () => api.post(`/payment/momo/${orderId}`).then((r) => r.data.data),
    onMutate: () => setStatus('creating'),
    onSuccess: (data) => {
      setMomoData(data)
      setStatus('pending')
    },
    onError: () => setStatus('failed'),
  })

  const createZaloPayPaymentMutation = useMutation({
    mutationFn: () => api.post(`/payment/zalopay/${orderId}`).then((r) => r.data.data),
    onMutate: () => setStatus('creating'),
    onSuccess: (data) => {
      setZaloPayData(data)
      setStatus('pending')
    },
    onError: () => setStatus('failed'),
  })

  const handleCreatePayment = () => {
    if (method === 'zalopay') {
      createZaloPayPaymentMutation.mutate()
    } else {
      createMomoPaymentMutation.mutate()
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setMomoData(null)
    setZaloPayData(null)
    setPollCount(0)
  }

  const payUrl = method === 'zalopay' ? zaloPayData?.orderUrl : momoData?.payUrl
  const qrValue =
    method === 'zalopay'
      ? (zaloPayData?.qrCode ?? zaloPayData?.orderUrl ?? '')
      : (momoData?.payUrl ?? '')
  const amount = method === 'zalopay' ? zaloPayData?.amount : momoData?.amount

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Success state
  if (status === 'success' || order.status === 'paid') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-6">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-green-700">Payment Successful!</h1>
          <p className="text-muted-foreground mt-2">Your order #{orderId} has been confirmed.</p>
        </div>
        <Card className="border-0 shadow-sm text-left">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-medium">#{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-primary">{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deliver to</span>
              <span className="font-medium text-right max-w-50">
                {order.firstName} {order.lastName}, {order.address}
              </span>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => navigate('/dashboard')} className="w-full">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  // Failed state
  if (status === 'failed') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Payment Failed</h1>
          <p className="text-muted-foreground mt-2">Something went wrong with your payment.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/cart')} className="flex-1 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Button>
          <Button onClick={handleReset} className="flex-1 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/checkout')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Payment</h1>
          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
        </div>
      </div>

      {/* Order summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground truncate flex-1 mr-2">
                {item.book?.title} × {item.quantity}
              </span>
              <span className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.totalAmount)}</span>
          </div>
          <div className="text-xs text-muted-foreground pt-1">
            Ship to: {order.firstName} {order.lastName} — {order.address}
          </div>
        </CardContent>
      </Card>

      {/* Idle: prompt to generate QR */}
      {status === 'idle' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <img
                src={provider.logoUrl}
                alt={provider.label}
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="text-left">
                <p className="font-semibold text-lg">Pay with {provider.label}</p>
                <p className="text-sm text-muted-foreground">Fast & secure mobile payment</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Click below to generate a QR code. Scan it with your {provider.label} app to complete
              payment.
            </p>
            <Button
              className="w-full gap-2"
              style={{ backgroundColor: provider.color }}
              size="lg"
              onClick={handleCreatePayment}
            >
              <Smartphone className="h-5 w-5" />
              Generate {provider.label} QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Creating: spinner */}
      {status === 'creating' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: provider.color }} />
            <p className="mt-4 text-muted-foreground">Generating QR code...</p>
          </CardContent>
        </Card>
      )}

      {/* Pending: QR code + polling */}
      {status === 'pending' && qrValue && (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="p-4 text-white text-center" style={{ backgroundColor: provider.color }}>
            <div className="flex items-center justify-center gap-2">
              <img
                src={provider.logoUrl}
                alt={provider.label}
                className="h-8 w-8 object-contain brightness-0 invert"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <span className="text-lg font-bold">{provider.label} Payment</span>
            </div>
            {amount !== undefined && (
              <p className="text-sm mt-1 text-white/80">
                Amount: <strong>{formatPrice(amount)}</strong>
              </p>
            )}
          </div>

          <CardContent className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Badge variant="secondary" className="gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: provider.color }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: provider.color }}
                  />
                </span>
                Waiting for payment...
              </Badge>
              {pollCount > 0 && (
                <span className="text-xs text-muted-foreground">Checking... ({pollCount})</span>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl shadow-inner border">
                <QRCodeSVG value={qrValue} size={200} level="H" includeMargin={false} />
              </div>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How to pay:</p>
              <ol className="text-left space-y-1 text-xs max-w-xs mx-auto">
                {provider.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 font-bold" style={{ color: provider.color }}>
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <Separator />

            <div className="flex gap-2">
              {payUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(payUrl, '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open in Browser
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex-1" onClick={handleReset}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                New QR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
