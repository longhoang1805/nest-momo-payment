import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

export function ZaloPayCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const appTransId = searchParams.get('apptransid')
    const status = searchParams.get('status')

    if (!appTransId) {
      navigate('/dashboard')
      return
    }

    // Extract internal order ID from appTransId format: YYMMDD_ORDER_{id}_{timestamp}
    const match = appTransId.match(/ORDER_(\d+)_/)
    const internalId = match ? match[1] : null

    // Notify backend about the redirect
    api
      .get('/payment/zalopay/redirect', {
        params: Object.fromEntries(searchParams.entries()),
      })
      .finally(() => {
        if (internalId) {
          navigate(`/payment/${internalId}?method=zalopay&status=${status}`, { replace: true })
        } else {
          navigate('/dashboard')
        }
      })
  }, [searchParams, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Processing payment result...</p>
      </div>
    </div>
  )
}
