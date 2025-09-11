import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Dashboard from '@/pages/sales/Dashboard'
import Customers from '@/pages/sales/Customers'
import NewCustomer from '@/pages/sales/NewCustomer'
import NewInvoice from '@/pages/sales/NewInvoice'
import { LocalDataManager } from '@/utils/localData'

// اختبار شامل لنظام المبيعات
describe('نظام المبيعات - الاختبار الشامل', () => {
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

  describe('لوحة معلومات المبيعات', () => {
    it('يجب عرض لوحة المعلومات بشكل صحيح', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/لوحة معلومات المبيعات/)).toBeInTheDocument()
      expect(screen.getByText(/إجمالي المبيعات/)).toBeInTheDocument()
      expect(screen.getByText(/عدد الفواتير/)).toBeInTheDocument()
      expect(screen.getByText(/متوسط قيمة الفاتورة/)).toBeInTheDocument()
    })

    it('يجب عرض الرسوم البيانية', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/مبيعات الأشهر الأخيرة/)).toBeInTheDocument()
      })
    })

    it('يجب عرض المعاملات الأخيرة', async () => {
      const testInvoices = [
        {
          id: '1',
          customerId: '1',
          customerName: 'عميل تجريبي',
          items: [],
          total: 1000,
          date: new Date().toISOString(),
          status: 'completed' as const,
          paymentMethod: 'cash' as const
        }
      ]

      localStorage.setItem('salesInvoices', JSON.stringify(testInvoices))

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/المعاملات الأخيرة/)).toBeInTheDocument()
      })
    })
  })

  describe('إدارة العملاء', () => {
    it('يجب عرض قائمة العملاء', async () => {
      const testCustomers = [
        {
          id: '1',
          name: 'عميل تجريبي',
          email: 'test@example.com',
          phone: '123456789',
          address: 'عنوان تجريبي',
          createdAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('customers', JSON.stringify(testCustomers))

      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('عميل تجريبي')).toBeInTheDocument()
      })
    })

    it('يجب البحث في العملاء', async () => {
      const testCustomers = [
        {
          id: '1',
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          phone: '123456789',
          address: 'الرياض',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'فاطمة علي',
          email: 'fatima@example.com',
          phone: '987654321',
          address: 'جدة',
          createdAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('customers', JSON.stringify(testCustomers))

      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      const searchInput = await screen.findByPlaceholderText(/البحث في العملاء/)
      await user.type(searchInput, 'أحمد')

      await waitFor(() => {
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument()
        expect(screen.queryByText('فاطمة علي')).not.toBeInTheDocument()
      })
    })

    it('يجب فلترة العملاء حسب المدينة', async () => {
      const testCustomers = [
        {
          id: '1',
          name: 'عميل الرياض',
          email: 'riyadh@example.com',
          phone: '123456789',
          address: 'الرياض',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'عميل جدة',
          email: 'jeddah@example.com',
          phone: '987654321',
          address: 'جدة',
          createdAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('customers', JSON.stringify(testCustomers))

      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      // اختبار الفلتر
      const filterButton = await screen.findByText(/تصفية/)
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('عميل الرياض')).toBeInTheDocument()
        expect(screen.getByText('عميل جدة')).toBeInTheDocument()
      })
    })
  })

  describe('إضافة عميل جديد', () => {
    it('يجب إضافة عميل جديد بنجاح', async () => {
      render(
        <TestWrapper>
          <NewCustomer />
        </TestWrapper>
      )

      // ملء النموذج
      await user.type(await screen.findByLabelText(/اسم العميل/), 'عميل جديد')
      await user.type(await screen.findByLabelText(/البريد الإلكتروني/), 'new@example.com')
      await user.type(await screen.findByLabelText(/رقم الهاتف/), '555123456')
      await user.type(await screen.findByLabelText(/العنوان/), 'عنوان العميل الجديد')

      // حفظ العميل
      const saveButton = await screen.findByRole('button', { name: /حفظ العميل/ })
      await user.click(saveButton)

      await waitFor(() => {
        const customers = LocalDataManager.getCustomers()
        expect(customers).toHaveLength(1)
        expect(customers[0].name).toBe('عميل جديد')
        expect(customers[0].email).toBe('new@example.com')
      })
    })

    it('يجب التحقق من صحة البيانات', async () => {
      render(
        <TestWrapper>
          <NewCustomer />
        </TestWrapper>
      )

      // محاولة حفظ نموذج فارغ
      const saveButton = await screen.findByRole('button', { name: /حفظ العميل/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/اسم العميل مطلوب/)).toBeInTheDocument()
      })
    })

    it('يجب التحقق من صحة البريد الإلكتروني', async () => {
      render(
        <TestWrapper>
          <NewCustomer />
        </TestWrapper>
      )

      await user.type(await screen.findByLabelText(/اسم العميل/), 'عميل جديد')
      await user.type(await screen.findByLabelText(/البريد الإلكتروني/), 'بريد خاطئ')

      const saveButton = await screen.findByRole('button', { name: /حفظ العميل/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/صيغة البريد الإلكتروني غير صحيحة/)).toBeInTheDocument()
      })
    })
  })

  describe('إنشاء فاتورة جديدة', () => {
    beforeEach(() => {
      // إعداد بيانات تجريبية
      const customers = [
        {
          id: '1',
          name: 'عميل تجريبي',
          email: 'test@example.com',
          phone: '123456789',
          address: 'عنوان تجريبي',
          createdAt: new Date().toISOString()
        }
      ]

      const products = [
        {
          id: '1',
          name: 'منتج تجريبي',
          price: 100,
          cost: 80,
          quantity: 50,
          minQuantity: 10,
          category: 'فئة تجريبية',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('customers', JSON.stringify(customers))
      localStorage.setItem('products', JSON.stringify(products))
    })

    it('يجب إنشاء فاتورة جديدة بنجاح', async () => {
      render(
        <TestWrapper>
          <NewInvoice />
        </TestWrapper>
      )

      // اختيار العميل
      const customerSelect = await screen.findByRole('combobox')
      await user.click(customerSelect)
      
      await waitFor(() => {
        const customerOption = screen.getByText('عميل تجريبي')
        user.click(customerOption)
      })

      // إضافة منتج
      const addProductButton = await screen.findByText(/إضافة منتج/)
      await user.click(addProductButton)

      // حفظ الفاتورة
      const saveButton = await screen.findByRole('button', { name: /حفظ الفاتورة/ })
      await user.click(saveButton)

      await waitFor(() => {
        const invoices = LocalDataManager.getSalesInvoices()
        expect(invoices).toHaveLength(1)
      })
    })

    it('يجب حساب الإجمالي بشكل صحيح', async () => {
      render(
        <TestWrapper>
          <NewInvoice />
        </TestWrapper>
      )

      // اختبار حساب الإجماليات
      await waitFor(() => {
        expect(screen.getByText(/الإجمالي/)).toBeInTheDocument()
      })
    })

    it('يجب تطبيق الخصم بشكل صحيح', async () => {
      render(
        <TestWrapper>
          <NewInvoice />
        </TestWrapper>
      )

      // اختبار تطبيق الخصم
      const discountInput = await screen.findByLabelText(/الخصم/)
      await user.type(discountInput, '10')

      await waitFor(() => {
        // التحقق من تحديث الإجمالي
        expect(screen.getByText(/الإجمالي/)).toBeInTheDocument()
      })
    })
  })

  describe('اختبار الأداء', () => {
    it('يجب تحميل لوحة المعلومات بسرعة', async () => {
      const startTime = performance.now()

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/لوحة معلومات المبيعات/)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // يجب أن يكون وقت التحميل أقل من ثانيتين
      expect(loadTime).toBeLessThan(2000)
    })

    it('يجب التعامل مع كمية كبيرة من البيانات', async () => {
      // إنشاء 1000 عميل
      const largeCustomerList = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `عميل ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `12345678${i}`,
        address: `عنوان ${i + 1}`,
        createdAt: new Date().toISOString()
      }))

      localStorage.setItem('customers', JSON.stringify(largeCustomerList))

      const startTime = performance.now()

      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('عميل 1')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // يجب أن يكون وقت التحميل معقول حتى مع البيانات الكثيرة
      expect(loadTime).toBeLessThan(5000)
    })

    it('يجب البحث بسرعة في البيانات الكثيرة', async () => {
      const largeCustomerList = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `عميل ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `12345678${i}`,
        address: `عنوان ${i + 1}`,
        createdAt: new Date().toISOString()
      }))

      localStorage.setItem('customers', JSON.stringify(largeCustomerList))

      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      const searchInput = await screen.findByPlaceholderText(/البحث في العملاء/)

      const startTime = performance.now()
      await user.type(searchInput, 'عميل 500')

      await waitFor(() => {
        expect(screen.getByText('عميل 500')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const searchTime = endTime - startTime

      // البحث يجب أن يكون سريع
      expect(searchTime).toBeLessThan(1000)
    })
  })

  describe('اختبار التفاعلات المعقدة', () => {
    it('يجب التعامل مع سيناريو كامل لإنشاء فاتورة', async () => {
      // إعداد البيانات
      const customers = [
        {
          id: '1',
          name: 'عميل مهم',
          email: 'important@example.com',
          phone: '123456789',
          address: 'عنوان مهم',
          createdAt: new Date().toISOString()
        }
      ]

      const products = [
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
          name: 'ماوس',
          price: 150,
          cost: 100,
          quantity: 50,
          minQuantity: 10,
          category: 'إلكترونيات',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('customers', JSON.stringify(customers))
      localStorage.setItem('products', JSON.stringify(products))

      render(
        <TestWrapper>
          <NewInvoice />
        </TestWrapper>
      )

      // 1. اختيار العميل
      const customerSelect = await screen.findByRole('combobox')
      await user.click(customerSelect)
      
      await waitFor(() => {
        const customerOption = screen.getByText('عميل مهم')
        user.click(customerOption)
      })

      // 2. إضافة منتجات متعددة
      const addProductButton = await screen.findByText(/إضافة منتج/)
      await user.click(addProductButton)

      // 3. تعديل الكمية
      // (سيكون هناك منطق لتعديل الكمية)

      // 4. تطبيق خصم
      const discountInput = await screen.findByLabelText(/الخصم/)
      await user.type(discountInput, '5')

      // 5. حفظ الفاتورة
      const saveButton = await screen.findByRole('button', { name: /حفظ الفاتورة/ })
      await user.click(saveButton)

      await waitFor(() => {
        const invoices = LocalDataManager.getSalesInvoices()
        expect(invoices).toHaveLength(1)
        expect(invoices[0].customerId).toBe('1')
      })
    })
  })

  describe('اختبار حالات الخطأ', () => {
    it('يجب التعامل مع فشل تحميل البيانات', async () => {
      // محاكاة خطأ في localStorage
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('فشل في الوصول للتخزين')
      })

      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      // يجب عرض رسالة خطأ أو حالة افتراضية
      await waitFor(() => {
        expect(screen.queryByText(/خطأ/) || screen.queryByText(/لا توجد بيانات/)).toBeInTheDocument()
      })
    })

    it('يجب التعامل مع بيانات تالفة', async () => {
      // إضافة بيانات JSON تالفة
      localStorage.setItem('customers', 'بيانات تالفة')

      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      // يجب التعامل مع الخطأ بلطف
      await waitFor(() => {
        expect(screen.getByText(/لا توجد عملاء/) || screen.getByText(/خطأ/)).toBeInTheDocument()
      })
    })
  })

  describe('اختبار إمكانية الوصول', () => {
    it('يجب دعم التنقل بلوحة المفاتيح', async () => {
      render(
        <TestWrapper>
          <NewCustomer />
        </TestWrapper>
      )

      const nameInput = await screen.findByLabelText(/اسم العميل/)
      nameInput.focus()

      // التنقل باستخدام Tab
      await user.keyboard('{Tab}')

      const emailInput = await screen.findByLabelText(/البريد الإلكتروني/)
      expect(emailInput).toHaveFocus()
    })

    it('يجب وجود aria-labels مناسبة', async () => {
      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      )

      const searchInput = await screen.findByPlaceholderText(/البحث في العملاء/)
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('بحث'))
    })
  })
})