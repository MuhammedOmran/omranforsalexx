import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import App from '@/App'

// اختبار تدفق كامل للمبيعات
describe('Sales Integration Flow', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('يمكن إنشاء فاتورة مبيعات كاملة', async () => {
    const user = userEvent.setup()
    
    const { queryByText, getByLabelText, getByRole, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )

    // تسجيل الدخول
    if (queryByText('تسجيل الدخول')) {
      await user.type(getByLabelText(/البريد الإلكتروني/), 'admin@omran.com')
      await user.type(getByLabelText(/كلمة المرور/), 'SecureAdminPass')
      await user.click(getByRole('button', { name: /تسجيل الدخول/ }))
    }

    // الانتقال لصفحة المبيعات
    await user.click(getByText(/المبيعات/))
    await user.click(getByText(/فاتورة جديدة/))

    expect(getByText(/فاتورة مبيعات جديدة/)).toBeInTheDocument()
  })
})