import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { vi } from 'vitest'

// إنشاء QueryClient لكل اختبار
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// مزود شامل للاختبارات
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// دالة render مخصصة
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// مساعدات للاختبارات
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    store
  }
}

export const createMockUser = () => ({
  id: 'test-user',
  name: 'مستخدم تجريبي',
  email: 'test@example.com',
  role: {
    id: 'admin',
    name: 'admin',
    nameAr: 'مدير',
    description: 'مدير النظام',
    level: 1,
    permissions: ['*'],
    isSystem: true
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  permissions: []
})

export const createMockProduct = () => ({
  id: '1',
  name: 'منتج تجريبي',
  price: 100,
  cost: 80,
  quantity: 50,
  minQuantity: 10,
  category: 'فئة تجريبية',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

export const createMockInvoice = () => ({
  id: '1',
  customerId: '1',
  customerName: 'عميل تجريبي',
  items: [
    {
      productId: '1',
      productName: 'منتج تجريبي',
      quantity: 2,
      price: 100,
      total: 200
    }
  ],
  subtotal: 200,
  discount: 0,
  tax: 30,
  total: 230,
  date: new Date().toISOString(),
  status: 'completed' as const,
  paymentMethod: 'cash' as const
})