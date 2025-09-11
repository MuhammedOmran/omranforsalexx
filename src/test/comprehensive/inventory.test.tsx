import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Products from '@/pages/inventory/Products'
import NewProduct from '@/pages/inventory/NewProduct'
import Stock from '@/pages/inventory/Stock'
import { LocalDataManager } from '@/utils/localData'

// اختبار شامل لنظام المخزون
describe('نظام المخزون - الاختبار الشامل', () => {
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

  describe('إدارة المنتجات', () => {
    it('يجب عرض قائمة المنتجات', async () => {
      const testProducts = [
        {
          id: '1',
          name: 'لابتوب ديل',
          price: 5000,
          cost: 4000,
          quantity: 10,
          minQuantity: 2,
          category: 'إلكترونيات',
          barcode: '123456789012',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('products', JSON.stringify(testProducts))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('لابتوب ديل')).toBeInTheDocument()
        expect(screen.getByText('5000')).toBeInTheDocument()
      })
    })

    it('يجب البحث في المنتجات بالاسم', async () => {
      const testProducts = [
        {
          id: '1',
          name: 'لابتوب ديل',
          price: 5000,
          cost: 4000,
          quantity: 10,
          minQuantity: 2,
          category: 'إلكترونيات',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'ماوس لوجيتيك',
          price: 150,
          cost: 100,
          quantity: 50,
          minQuantity: 10,
          category: 'إلكترونيات',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('products', JSON.stringify(testProducts))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      const searchInput = await screen.findByPlaceholderText(/البحث في المنتجات/)
      await user.type(searchInput, 'لابتوب')

      await waitFor(() => {
        expect(screen.getByText('لابتوب ديل')).toBeInTheDocument()
        expect(screen.queryByText('ماوس لوجيتيك')).not.toBeInTheDocument()
      })
    })

    it('يجب فلترة المنتجات حسب الفئة', async () => {
      const testProducts = [
        {
          id: '1',
          name: 'لابتوب',
          price: 5000,
          cost: 4000,
          quantity: 10,
          minQuantity: 2,
          category: 'إلكترونيات',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'قميص',
          price: 200,
          cost: 150,
          quantity: 25,
          minQuantity: 5,
          category: 'ملابس',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('products', JSON.stringify(testProducts))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      // اختبار الفلتر حسب الفئة
      const categoryFilter = await screen.findByText(/الفئات/)
      await user.click(categoryFilter)

      await waitFor(() => {
        expect(screen.getByText('لابتوب')).toBeInTheDocument()
        expect(screen.getByText('قميص')).toBeInTheDocument()
      })
    })

    it('يجب عرض تنبيه للمنتجات قليلة المخزون', async () => {
      const testProducts = [
        {
          id: '1',
          name: 'منتج قليل المخزون',
          price: 1000,
          cost: 800,
          quantity: 1, // أقل من الحد الأدنى
          minQuantity: 5,
          category: 'عام',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('products', JSON.stringify(testProducts))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/مخزون منخفض/) || screen.getByText(/تنبيه/)).toBeInTheDocument()
      })
    })
  })

  describe('إضافة منتج جديد', () => {
    it('يجب إضافة منتج جديد بنجاح', async () => {
      render(
        <TestWrapper>
          <NewProduct />
        </TestWrapper>
      )

      // ملء بيانات المنتج
      await user.type(await screen.findByLabelText(/اسم المنتج/), 'منتج جديد')
      await user.type(await screen.findByLabelText(/السعر/), '1500')
      await user.type(await screen.findByLabelText(/التكلفة/), '1200')
      await user.type(await screen.findByLabelText(/الكمية/), '20')
      await user.type(await screen.findByLabelText(/الحد الأدنى/), '5')
      await user.type(await screen.findByLabelText(/الفئة/), 'فئة جديدة')

      // حفظ المنتج
      const saveButton = await screen.findByRole('button', { name: /حفظ المنتج/ })
      await user.click(saveButton)

      await waitFor(() => {
        const products = LocalDataManager.getProducts()
        expect(products).toHaveLength(1)
        expect(products[0].name).toBe('منتج جديد')
        expect(products[0].price).toBe(1500)
      })
    })

    it('يجب التحقق من صحة البيانات المطلوبة', async () => {
      render(
        <TestWrapper>
          <NewProduct />
        </TestWrapper>
      )

      // محاولة حفظ منتج بدون اسم
      const saveButton = await screen.findByRole('button', { name: /حفظ المنتج/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/اسم المنتج مطلوب/)).toBeInTheDocument()
      })
    })

    it('يجب التحقق من أن السعر أكبر من التكلفة', async () => {
      render(
        <TestWrapper>
          <NewProduct />
        </TestWrapper>
      )

      await user.type(await screen.findByLabelText(/اسم المنتج/), 'منتج اختبار')
      await user.type(await screen.findByLabelText(/السعر/), '1000')
      await user.type(await screen.findByLabelText(/التكلفة/), '1200') // تكلفة أعلى من السعر

      const saveButton = await screen.findByRole('button', { name: /حفظ المنتج/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/السعر يجب أن يكون أكبر من التكلفة/)).toBeInTheDocument()
      })
    })

    it('يجب التحقق من أن الكمية رقم موجب', async () => {
      render(
        <TestWrapper>
          <NewProduct />
        </TestWrapper>
      )

      await user.type(await screen.findByLabelText(/اسم المنتج/), 'منتج اختبار')
      await user.type(await screen.findByLabelText(/الكمية/), '-5') // كمية سالبة

      const saveButton = await screen.findByRole('button', { name: /حفظ المنتج/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/الكمية يجب أن تكون رقم موجب/)).toBeInTheDocument()
      })
    })
  })

  describe('إدارة المخزون', () => {
    beforeEach(() => {
      const testProducts = [
        {
          id: '1',
          name: 'منتج للاختبار',
          price: 1000,
          cost: 800,
          quantity: 50,
          minQuantity: 10,
          category: 'اختبار',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('products', JSON.stringify(testProducts))
    })

    it('يجب إضافة مخزون بنجاح', async () => {
      render(
        <TestWrapper>
          <Stock />
        </TestWrapper>
      )

      // اختيار المنتج
      const productSelect = await screen.findByRole('combobox')
      await user.click(productSelect)
      
      await waitFor(() => {
        const productOption = screen.getByText('منتج للاختبار')
        user.click(productOption)
      })

      // إدخال الكمية المضافة
      const quantityInput = await screen.findByLabelText(/الكمية المضافة/)
      await user.type(quantityInput, '20')

      // إضافة ملاحظة
      const noteInput = await screen.findByLabelText(/ملاحظات/)
      await user.type(noteInput, 'إضافة مخزون جديد')

      // حفظ الحركة
      const saveButton = await screen.findByRole('button', { name: /حفظ الحركة/ })
      await user.click(saveButton)

      await waitFor(() => {
        const products = LocalDataManager.getProducts()
        expect(products[0].quantity).toBe(70) // 50 + 20
      })
    })

    it('يجب خصم مخزون بنجاح', async () => {
      render(
        <TestWrapper>
          <Stock />
        </TestWrapper>
      )

      // اختيار نوع الحركة (خصم)
      const movementTypeSelect = await screen.findByLabelText(/نوع الحركة/)
      await user.selectOptions(movementTypeSelect, 'خصم')

      // اختيار المنتج
      const productSelect = await screen.findByRole('combobox')
      await user.click(productSelect)

      // إدخال كمية الخصم
      const quantityInput = await screen.findByLabelText(/الكمية المخصومة/)
      await user.type(quantityInput, '10')

      const saveButton = await screen.findByRole('button', { name: /حفظ الحركة/ })
      await user.click(saveButton)

      await waitFor(() => {
        const products = LocalDataManager.getProducts()
        expect(products[0].quantity).toBe(40) // 50 - 10
      })
    })

    it('يجب منع خصم كمية أكبر من المتوفر', async () => {
      render(
        <TestWrapper>
          <Stock />
        </TestWrapper>
      )

      // اختيار نوع الحركة (خصم)
      const movementTypeSelect = await screen.findByLabelText(/نوع الحركة/)
      await user.selectOptions(movementTypeSelect, 'خصم')

      // محاولة خصم كمية أكبر من المتوفر
      const quantityInput = await screen.findByLabelText(/الكمية المخصومة/)
      await user.type(quantityInput, '100') // أكبر من 50

      const saveButton = await screen.findByRole('button', { name: /حفظ الحركة/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/الكمية المطلوبة أكبر من المتوفر/)).toBeInTheDocument()
      })
    })

    it('يجب عرض تاريخ حركات المخزون', async () => {
      // إضافة حركات سابقة
      const movements = [
        {
          id: '1',
          productId: '1',
          productName: 'منتج للاختبار',
          type: 'إضافة',
          quantity: 20,
          date: new Date().toISOString(),
          note: 'حركة سابقة'
        }
      ]
      localStorage.setItem('stockMovements', JSON.stringify(movements))

      render(
        <TestWrapper>
          <Stock />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/تاريخ الحركات/) || screen.getByText(/حركة سابقة/)).toBeInTheDocument()
      })
    })
  })

  describe('اختبار الباركود', () => {
    it('يجب البحث بالباركود بنجاح', async () => {
      const testProducts = [
        {
          id: '1',
          name: 'منتج بباركود',
          price: 1000,
          cost: 800,
          quantity: 50,
          minQuantity: 10,
          category: 'اختبار',
          barcode: '123456789012',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('products', JSON.stringify(testProducts))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      // البحث بالباركود
      const searchInput = await screen.findByPlaceholderText(/البحث في المنتجات/)
      await user.type(searchInput, '123456789012')

      await waitFor(() => {
        expect(screen.getByText('منتج بباركود')).toBeInTheDocument()
      })
    })

    it('يجب منع تكرار الباركود', async () => {
      const existingProduct = {
        id: '1',
        name: 'منتج موجود',
        price: 1000,
        cost: 800,
        quantity: 50,
        minQuantity: 10,
        category: 'اختبار',
        barcode: '123456789012',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      localStorage.setItem('products', JSON.stringify([existingProduct]))

      render(
        <TestWrapper>
          <NewProduct />
        </TestWrapper>
      )

      // إضافة منتج بنفس الباركود
      await user.type(await screen.findByLabelText(/اسم المنتج/), 'منتج جديد')
      await user.type(await screen.findByLabelText(/الباركود/), '123456789012')

      const saveButton = await screen.findByRole('button', { name: /حفظ المنتج/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/الباركود موجود مسبقاً/)).toBeInTheDocument()
      })
    })
  })

  describe('اختبار الأداء للمخزون', () => {
    it('يجب التعامل مع عدد كبير من المنتجات', async () => {
      // إنشاء 1000 منتج
      const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
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

      localStorage.setItem('products', JSON.stringify(largeProductList))

      const startTime = performance.now()

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('منتج 1')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // يجب أن يكون وقت التحميل معقول
      expect(loadTime).toBeLessThan(5000)
    })

    it('يجب البحث بسرعة في المنتجات الكثيرة', async () => {
      const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
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

      localStorage.setItem('products', JSON.stringify(largeProductList))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      const searchInput = await screen.findByPlaceholderText(/البحث في المنتجات/)

      const startTime = performance.now()
      await user.type(searchInput, 'منتج 500')

      await waitFor(() => {
        expect(screen.getByText('منتج 500')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const searchTime = endTime - startTime

      expect(searchTime).toBeLessThan(1000)
    })
  })

  describe('تقارير المخزون', () => {
    it('يجب حساب قيمة المخزون الإجمالية', async () => {
      const testProducts = [
        {
          id: '1',
          name: 'منتج 1',
          price: 1000,
          cost: 800,
          quantity: 10,
          minQuantity: 2,
          category: 'فئة 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'منتج 2',
          price: 500,
          cost: 400,
          quantity: 20,
          minQuantity: 5,
          category: 'فئة 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('products', JSON.stringify(testProducts))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      await waitFor(() => {
        // قيمة المخزون = (800 * 10) + (400 * 20) = 16000
        const totalValue = screen.getByText(/16000/) || screen.getByText(/قيمة المخزون/)
        expect(totalValue).toBeInTheDocument()
      })
    })

    it('يجب عرض المنتجات قليلة المخزون', async () => {
      const testProducts = [
        {
          id: '1',
          name: 'منتج قليل المخزون',
          price: 1000,
          cost: 800,
          quantity: 2,
          minQuantity: 10, // أقل من الحد الأدنى
          category: 'فئة 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('products', JSON.stringify(testProducts))

      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/منتج قليل المخزون/)).toBeInTheDocument()
        expect(screen.getByText(/تنبيه/) || screen.getByText(/مخزون منخفض/)).toBeInTheDocument()
      })
    })
  })
})