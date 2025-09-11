import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button Component', () => {
  it('يعرض النص بشكل صحيح', () => {
    const { getByRole } = render(<Button>اضغط هنا</Button>)
    expect(getByRole('button', { name: /اضغط هنا/ })).toBeInTheDocument()
  })

  it('يستدعي onClick عند الضغط', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    const { getByRole } = render(<Button onClick={handleClick}>اضغط</Button>)
    
    await user.click(getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('يطبق variant بشكل صحيح', () => {
    const { getByRole } = render(<Button variant="destructive">حذف</Button>)
    const button = getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('يكون معطل عند disabled', () => {
    const { getByRole } = render(<Button disabled>معطل</Button>)
    const button = getByRole('button')
    expect(button).toBeDisabled()
  })

  it('يعرض أيقونة التحميل', () => {
    const { getByRole } = render(<Button disabled>جاري التحميل</Button>)
    const button = getByRole('button')
    expect(button).toBeDisabled()
  })

  it('يطبق الأحجام المختلفة', () => {
    const { rerender, getByRole } = render(<Button size="sm">صغير</Button>)
    let button = getByRole('button')
    expect(button).toHaveClass('h-9')

    rerender(<Button size="lg">كبير</Button>)
    button = getByRole('button')
    expect(button).toHaveClass('h-11')
  })
})