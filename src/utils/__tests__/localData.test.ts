import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalDataManager, Product, Customer } from '../localData'
import { mockLocalStorage } from '@/test/utils/test-utils'

describe('LocalDataManager', () => {
  const mockStorage = mockLocalStorage()

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.clear()
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage
    })
  })

  describe('Products Management', () => {
    it('يسترجع منتجات فارغة في البداية', () => {
      const products = LocalDataManager.getProducts()
      expect(products).toEqual([])
    })

    it('يحفظ المنتجات بشكل صحيح', () => {
      const testProducts: Product[] = [
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

      LocalDataManager.saveProducts(testProducts)
      
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'products',
        JSON.stringify(testProducts)
      )
    })

    it('يسترجع المنتجات المحفوظة', () => {
      const testProducts: Product[] = [
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

      mockStorage.store['products'] = JSON.stringify(testProducts)
      
      const products = LocalDataManager.getProducts()
      expect(products).toEqual(testProducts)
    })
  })

  describe('Customers Management', () => {
    it('يسترجع عملاء فارغين في البداية', () => {
      const customers = LocalDataManager.getCustomers()
      expect(customers).toEqual([])
    })

    it('يحفظ العملاء بشكل صحيح', () => {
      const testCustomers: Customer[] = [
        {
          id: '1',
          name: 'عميل تجريبي',
          email: 'test@example.com',
          phone: '123456789',
          address: 'عنوان تجريبي',
          createdAt: new Date().toISOString()
        }
      ]

      LocalDataManager.saveCustomers(testCustomers)
      
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'customers',
        JSON.stringify(testCustomers)
      )
    })
  })

  describe('Sales Analytics', () => {
    it('يحسب تحليلات المبيعات بشكل صحيح', () => {
      // إعداد بيانات تجريبية
      const testInvoices = [
        {
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
        }
      ]

      mockStorage.store['salesInvoices'] = JSON.stringify(testInvoices)
      
      const analytics = LocalDataManager.getSalesAnalytics()
      
      expect(analytics.totalSales).toBe(230)
      expect(analytics.totalOrders).toBe(1)
      expect(analytics.totalRevenue).toBe(200)
      expect(analytics.avgOrderValue).toBe(200)
    })

    it('يتعامل مع التواريخ المحددة', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      
      const analytics = LocalDataManager.getSalesAnalytics(startDate, endDate)
      
      expect(analytics).toHaveProperty('totalSales')
      expect(analytics).toHaveProperty('monthlyData')
      expect(analytics).toHaveProperty('topProducts')
      expect(analytics).toHaveProperty('topCustomers')
    })
  })

  describe('Sample Data Initialization', () => {
    it('ينشئ البيانات التجريبية عند عدم وجود بيانات', () => {
      LocalDataManager.initializeSampleData()
      
      // التحقق من أن البيانات تم إنشاؤها
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'products',
        expect.any(String)
      )
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'customers',
        expect.any(String)
      )
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'employees',
        expect.any(String)
      )
    })

    it('لا ينشئ بيانات إذا كانت موجودة', () => {
      // إضافة بيانات موجودة
      mockStorage.store['products'] = JSON.stringify([{ id: '1' }])
      
      LocalDataManager.initializeSampleData()
      
      // التحقق من أنه لم يتم استبدال البيانات
      const callCount = mockStorage.setItem.mock.calls.filter(
        call => call[0] === 'products'
      ).length
      expect(callCount).toBe(0)
    })
  })
})