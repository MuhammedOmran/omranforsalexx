import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { mockLocalStorage } from '@/test/utils/test-utils'

// مكون اختبار للوصول للسياق
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, hasPermission } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'مسجل الدخول' : 'غير مسجل'}
      </div>
      <div data-testid="user-name">{user?.name || 'لا يوجد مستخدم'}</div>
      <button 
        onClick={() => login('admin@omran.com', 'SecureAdminPass')}
        data-testid="login-btn"
      >
        تسجيل الدخول
      </button>
      <button onClick={logout} data-testid="logout-btn">
        تسجيل الخروج
      </button>
      <div data-testid="sales-permission">
        {hasPermission('sales.create') ? 'يمكن إنشاء مبيعات' : 'لا يمكن إنشاء مبيعات'}
      </div>
    </div>
  )
}

describe('AuthContext', () => {
  const mockStorage = mockLocalStorage()

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.clear()
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage
    })
  })

  it('يبدأ بالمستخدم الافتراضي', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // انتظار قصير للمحاكاة
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(getByTestId('auth-status')).toHaveTextContent('مسجل الدخول')
    expect(getByTestId('user-name')).toHaveTextContent('مدير النظام')
  })

  it('يسمح بتسجيل الدخول بالبيانات الصحيحة', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // تسجيل الخروج أولاً
    const logoutBtn = getByTestId('logout-btn')
    logoutBtn.click()

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(getByTestId('auth-status')).toHaveTextContent('غير مسجل')

    // تسجيل الدخول
    const loginBtn = getByTestId('login-btn')
    loginBtn.click()

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(getByTestId('auth-status')).toHaveTextContent('مسجل الدخول')
  })

  it('يتحقق من الصلاحيات بشكل صحيح', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(getByTestId('sales-permission')).toHaveTextContent('يمكن إنشاء مبيعات')
  })

  it('يسجل الخروج بشكل صحيح', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const logoutBtn = getByTestId('logout-btn')
    logoutBtn.click()

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(getByTestId('auth-status')).toHaveTextContent('غير مسجل')
    expect(getByTestId('user-name')).toHaveTextContent('لا يوجد مستخدم')
  })
})