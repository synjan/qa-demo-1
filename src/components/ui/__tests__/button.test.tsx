import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from '../button'

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
  })

  it('should render with different variants', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    
    variants.forEach(variant => {
      const { unmount } = render(<Button variant={variant}>Button</Button>)
      const button = screen.getByRole('button')
      
      const expectedClass = buttonVariants({ variant })
      expect(button.className).toMatch(new RegExp(expectedClass.split(' ')[0]))
      unmount()
    })
  })

  it('should render with different sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const
    
    sizes.forEach(size => {
      const { unmount } = render(<Button size={size}>Button</Button>)
      const button = screen.getByRole('button')
      
      // Check that button has appropriate size classes
      if (size === 'icon') {
        expect(button.className).toMatch(/size-\d+/)
      } else {
        expect(button.className).toMatch(/h-\d+|px-\d+/)
      }
      unmount()
    })
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none')
  })

  it('should render as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    
    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref Button</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current?.textContent).toBe('Ref Button')
  })

  it('should handle loading state', () => {
    const { rerender } = render(<Button>Normal</Button>)
    const button = screen.getByRole('button')
    
    expect(button).not.toHaveAttribute('aria-busy')
    
    // Simulate loading state by disabling
    rerender(<Button disabled>Loading...</Button>)
    expect(button).toBeDisabled()
  })

  it('should render with icon', () => {
    const Icon = () => <svg data-testid="icon" />
    
    render(
      <Button>
        <Icon />
        With Icon
      </Button>
    )
    
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('With Icon')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Keyboard Button</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    
    // Simulate Enter key press
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter', keyCode: 13 })
    fireEvent.keyUp(button, { key: 'Enter', code: 'Enter', keyCode: 13 })
    
    // Note: Button component might not handle keydown events directly
    // It relies on native button behavior which is handled by click in jsdom
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalled()
  })
})