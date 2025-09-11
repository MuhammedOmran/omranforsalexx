import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Dashboard from '@/pages/sales/Dashboard'
import Products from '@/pages/inventory/Products'
import Customers from '@/pages/sales/Customers'

// اختبارات الأداء تحت الضغط
describe('اختبار الأداء تحت الضغط', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    user = userEvent.setup()
    vi.clearAllMocks()
    localStorage.clear()
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )

  describe('اختبار الأداء مع بيانات ضخمة', () => {
    it('يجب التعامل مع 10,000 منتج', async () => {
      console.time('إنشاء 10,000 منتج')
      
      const largeProductList = Array.from({ length: 10000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `منتج رقم ${i + 1} - ${Math.random().toString(36).substr(2, 9)}`,
        price: Math.floor(Math.random() * 10000) + 100,
        cost: Math.floor(Math.random() * 8000) + 80,
        quantity: Math.floor(Math.random() * 1000) + 1,
        minQuantity: Math.floor(Math.random() * 20) + 5,
        category: `فئة ${i % 50}`,
        barcode: `${Math.floor(Math.random() * 1000000000000)}`,
        description: `وصف تفصيلي للمنتج رقم ${i + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }))
      
      console.timeEnd('إنشاء 10,000 منتج')

      console.time('حفظ البيانات في localStorage')
      localStorage.setItem('products', JSON.stringify(largeProductList))
      console.timeEnd('حفظ البيانات في localStorage')

      console.time('تحميل صفحة المنتجات')
      
      const { container } = render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/منتج رقم 1/)).toBeInTheDocument()
      }, { timeout: 10000 })

      console.timeEnd('تحميل صفحة المنتجات')

      // التحقق من عدم تجميد الواجهة
      expect(container).toBeInTheDocument()
      
      // قياس استهلاك الذاكرة
      if ('memory' in performance) {
        const memory = (performance as any).memory
        console.log('استهلاك الذاكرة:', {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
        })
        
        // التأكد من عدم تجاوز حد معين
        expect(memory.usedJSHeapSize).toBeLessThan(memory.jsHeapSizeLimit * 0.8)
      }
    })

    it('يجب البحث بسرعة في 10,000 منتج', async () => {
      const largeProductList = Array.from({ length: 10000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `منتج ${i + 1}`,
        price: 100 + i,
        cost: 80 + i,
        quantity: 50,
        minQuantity: 10,
        category: `فئة ${i % 100}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      localStorage.setItem('products', JSON.stringify(largeProductList))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      const searchInput = await screen.findByPlaceholderText(/البحث في المنتجات/, {}, { timeout: 10000 })

      // اختبار البحث بعدة مصطلحات
      const searchTerms = ['منتج 1000', 'منتج 5000', 'منتج 9999']
      
      for (const term of searchTerms) {
        console.time(`البحث عن: ${term}`)
        
        await user.clear(searchInput)
        await user.type(searchInput, term)

        await waitFor(() => {
          expect(screen.getByText(term)).toBeInTheDocument()
        }, { timeout: 3000 })

        console.timeEnd(`البحث عن: ${term}`)
      }
    })

    it('يجب التعامل مع 5,000 عميل', async () => {
      console.time('إنشاء 5,000 عميل')
      
      const largeCustomerList = Array.from({ length: 5000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `عميل ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `05${String(i).padStart(8, '0')}`,
        address: `العنوان رقم ${i + 1}, المدينة ${i % 20}, المنطقة ${i % 5}`,
        totalPurchases: Math.floor(Math.random() * 100000),
        lastPurchase: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString()
      }))
      
      console.timeEnd('إنشاء 5,000 عميل')

      localStorage.setItem('customers', JSON.stringify(largeCustomerList))

      console.time('تحميل صفحة العملاء')
      
      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('عميل 1')).toBeInTheDocument()
      }, { timeout: 10000 })

      console.timeEnd('تحميل صفحة العملاء')
    })

    it('يجب التعامل مع 20,000 فاتورة', async () => {
      console.time('إنشاء 20,000 فاتورة')
      
      const largeInvoiceList = Array.from({ length: 20000 }, (_, i) => ({
        id: `${i + 1}`,
        customerId: `${(i % 1000) + 1}`,
        customerName: `عميل ${(i % 1000) + 1}`,
        items: [
          {
            productId: `${(i % 100) + 1}`,
            productName: `منتج ${(i % 100) + 1}`,
            quantity: Math.floor(Math.random() * 10) + 1,
            price: Math.floor(Math.random() * 1000) + 100,
            total: 0
          }
        ],
        subtotal: Math.floor(Math.random() * 10000) + 1000,
        discount: Math.floor(Math.random() * 500),
        tax: 0,
        total: Math.floor(Math.random() * 10000) + 1000,
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
status: (['completed', 'pending', 'cancelled'] as const)[Math.floor(Math.random() * 3)],
        paymentMethod: (['cash', 'card', 'transfer'] as const)[Math.floor(Math.random() * 3)]
      }))
      
      console.timeEnd('إنشاء 20,000 فاتورة')

      localStorage.setItem('salesInvoices', JSON.stringify(largeInvoiceList))

      console.time('تحميل لوحة المعلومات مع البيانات الضخمة')
      
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/لوحة معلومات المبيعات/)).toBeInTheDocument()
      }, { timeout: 15000 })

      console.timeEnd('تحميل لوحة المعلومات مع البيانات الضخمة')
    })
  })

  describe('اختبار الأداء تحت الضغط المستمر', () => {
    it('يجب التعامل مع عمليات بحث متتالية', async () => {
      const products = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `منتج ${i + 1}`,
        price: 100 + i,
        cost: 80 + i,
        quantity: 50,
        minQuantity: 10,
        category: `فئة ${i % 10}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      localStorage.setItem('products', JSON.stringify(products))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      const searchInput = await screen.findByPlaceholderText(/البحث في المنتجات/)

      // تنفيذ 50 عملية بحث متتالية
      console.time('50 عملية بحث متتالية')
      
      for (let i = 0; i < 50; i++) {
        const searchTerm = `منتج ${Math.floor(Math.random() * 1000) + 1}`
        await user.clear(searchInput)
        await user.type(searchInput, searchTerm)
        
        // انتظار قصير بين العمليات
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      console.timeEnd('50 عملية بحث متتالية')

      // التأكد من أن الواجهة ما زالت تستجيب
      expect(searchInput).toBeInTheDocument()
    })

    it('يجب التعامل مع تغييرات سريعة في البيانات', async () => {
      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      console.time('تحديث البيانات 100 مرة')
      
      // تحديث البيانات 100 مرة بسرعة
      for (let i = 0; i < 100; i++) {
        const products = Array.from({ length: 100 }, (_, j) => ({
          id: `${j + 1}`,
          name: `منتج محدث ${i}-${j + 1}`,
          price: 100 + i + j,
          cost: 80 + i + j,
          quantity: 50,
          minQuantity: 10,
          category: `فئة ${j % 5}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))

        localStorage.setItem('products', JSON.stringify(products))
        
        // إعادة تحميل البيانات
        window.dispatchEvent(new Event('storage'))
        
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      console.timeEnd('تحديث البيانات 100 مرة')
    })
  })

  describe('اختبار تسرب الذاكرة', () => {
    it('يجب عدم حدوث تسرب في الذاكرة', async () => {
      if (!('memory' in performance)) {
        console.warn('Memory API غير متاح في هذا المتصفح')
        return
      }

      const initialMemory = (performance as any).memory.usedJSHeapSize

      // تحميل وإلغاء تحميل المكون عدة مرات
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <Products />
          </TestWrapper>
        )

        // إضافة بيانات
        const products = Array.from({ length: 100 }, (_, j) => ({
          id: `${j + 1}`,
          name: `منتج ${j + 1}`,
          price: 100 + j,
          cost: 80 + j,
          quantity: 50,
          minQuantity: 10,
          category: `فئة ${j % 5}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))

        localStorage.setItem('products', JSON.stringify(products))

        await waitFor(() => {
          expect(screen.getByText(/منتج 1/)).toBeInTheDocument()
        })

        // إلغاء التحميل
        unmount()
        
        // تنظيف قسري للذاكرة
        if ('gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc()
        }
      }

      const finalMemory = (performance as any).memory.usedJSHeapSize
      const memoryIncrease = finalMemory - initialMemory

      console.log('تغيير الذاكرة:', {
        initial: `${Math.round(initialMemory / 1024 / 1024)} MB`,
        final: `${Math.round(finalMemory / 1024 / 1024)} MB`,
        increase: `${Math.round(memoryIncrease / 1024 / 1024)} MB`
      })

      // يجب ألا تزيد الذاكرة كثيراً (أقل من 50 MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('اختبار الاستجابة تحت الحمل', () => {
    it('يجب الاستجابة للتفاعلات حتى مع الحمل الثقيل', async () => {
      const products = Array.from({ length: 5000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `منتج ${i + 1}`,
        price: 100 + i,
        cost: 80 + i,
        quantity: 50,
        minQuantity: 10,
        category: `فئة ${i % 20}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      localStorage.setItem('products', JSON.stringify(products))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('منتج 1')).toBeInTheDocument()
      }, { timeout: 10000 })

      // محاكاة حمل إضافي في الخلفية
      const heavyTask = () => {
        const start = Date.now()
        while (Date.now() - start < 100) {
          Math.random() * Math.random()
        }
      }

      const interval = setInterval(heavyTask, 50)

      try {
        // اختبار التفاعل مع الحمل الثقيل
        const searchInput = await screen.findByPlaceholderText(/البحث في المنتجات/)
        
        console.time('التفاعل مع الحمل الثقيل')
        await user.type(searchInput, 'منتج 100')

        await waitFor(() => {
          expect(screen.getByText('منتج 100')).toBeInTheDocument()
        }, { timeout: 5000 })
        
        console.timeEnd('التفاعل مع الحمل الثقيل')

      } finally {
        clearInterval(interval)
      }
    })
  })

  describe('اختبار الشبكة البطيئة', () => {
    it('يجب العمل مع تأخير الشبكة', async () => {
      // محاكاة بطء الشبكة
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockImplementation((...args: Parameters<typeof fetch>) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(originalFetch.apply(global, args))
          }, 1000) // تأخير ثانية واحدة
        })
      })

      try {
        render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        )

        await waitFor(() => {
          expect(screen.getByText(/لوحة معلومات المبيعات/)).toBeInTheDocument()
        }, { timeout: 15000 })

      } finally {
        global.fetch = originalFetch
      }
    })
  })
})