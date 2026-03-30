import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, ShoppingCart, LogOut, BookOpen, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { api } from '@/lib/api'
import { UsersTable } from './components/UsersTable'
import { OrdersTable } from './components/OrdersTable'
import { fmt, type Tab } from './types'

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const navigate = useNavigate()

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data.data),
  })

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => api.get('/admin/orders').then((r) => r.data.data),
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    navigate('/admin/login')
  }

  const totalRevenue = orders
    .filter((o: any) => o.status === 'paid')
    .reduce((sum: number, o: any) => sum + o.totalAmount, 0)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-200 bg-white shadow-sm">
          <SidebarHeader className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-bold leading-none">BookStore</p>
                <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Management
            </p>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'users'}
                  onClick={() => setActiveTab('users')}
                  className="rounded-lg text-sm"
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                  <span className="ml-auto text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                    {users.length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'orders'}
                  onClick={() => setActiveTab('orders')}
                  className="rounded-lg text-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Orders</span>
                  <span className="ml-auto text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                    {orders.length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="px-3 py-4 border-t border-slate-100">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-800">
              {activeTab === 'users' ? 'Users' : 'Orders'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="p-8">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">{users.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">{orders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Revenue (Paid)</p>
                  <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">{fmt(totalRevenue)}</p>
              </div>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-700">
                  {activeTab === 'users' ? 'All Users' : 'All Orders'}
                </h2>
              </div>

              {activeTab === 'users' &&
                (loadingUsers ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading...</div>
                ) : (
                  <UsersTable users={users} />
                ))}

              {activeTab === 'orders' &&
                (loadingOrders || loadingUsers ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading...</div>
                ) : (
                  <OrdersTable orders={orders} users={users} />
                ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
