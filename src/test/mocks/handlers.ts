import { http, HttpResponse } from 'msw'

export const handlers = [
  // محاكاة API تحويل العملات
  http.get('https://api.exchangerate-api.com/v4/latest/SAR', () => {
    return HttpResponse.json({
      base: 'SAR',
      date: '2024-01-01',
      rates: {
        USD: 0.27,
        EUR: 0.24,
        GBP: 0.21,
        JPY: 35.7,
        AED: 0.98,
        KWD: 0.08,
        QAR: 0.97,
        BHD: 0.10,
        OMR: 0.10,
        JOD: 0.19,
        EGP: 8.25,
        LBP: 4000,
        TRY: 7.85,
        IRR: 11250
      }
    })
  }),

  // محاكاة استجابات قاعدة البيانات
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 'test-user',
        name: 'مستخدم تجريبي',
        email: 'test@example.com',
        role: 'admin'
      },
      token: 'test-token'
    })
  }),

  http.get('/api/products', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'منتج تجريبي',
        price: 100,
        cost: 80,
        quantity: 50,
        category: 'فئة تجريبية'
      }
    ])
  }),

  http.get('/api/customers', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'عميل تجريبي',
        email: 'customer@example.com',
        phone: '123456789'
      }
    ])
  }),

  // محاكاة فشل الشبكة
  http.get('/api/error', () => {
    return HttpResponse.error()
  }),
]