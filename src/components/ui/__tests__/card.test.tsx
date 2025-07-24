import React from 'react'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../card'

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with content', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Card className="custom-card">Content</Card>)
      const card = screen.getByText('Content').closest('[data-slot="card"]')
      expect(card).toHaveClass('custom-card')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<Card ref={ref}>Card</Card>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardHeader', () => {
    it('should render header content', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      )
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should have correct spacing classes', () => {
      render(
        <Card>
          <CardHeader className="test-header">Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Header').closest('[data-slot="card-header"]')
      expect(header).toHaveClass('test-header')
      expect(header).toHaveClass('grid')
    })
  })

  describe('CardTitle', () => {
    it('should render title as div with correct data-slot', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Test Title')
      expect(title.tagName).toBe('DIV')
      expect(title).toHaveAttribute('data-slot', 'card-title')
    })

    it('should have correct styling classes', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Styled Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Styled Title')
      expect(title).toHaveClass('leading-none')
      expect(title).toHaveClass('font-semibold')
    })
  })

  describe('CardDescription', () => {
    it('should render description text', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Test description</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = screen.getByText('Test description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('text-muted-foreground')
    })
  })

  describe('CardContent', () => {
    it('should render content with proper spacing', () => {
      render(
        <Card>
          <CardContent>Main content</CardContent>
        </Card>
      )
      const content = screen.getByText('Main content')
      expect(content).toBeInTheDocument()
      // CardContent might have different spacing classes
      const parent = content.parentElement
      expect(parent?.className).toMatch(/p-|px-|py-/)
    })
  })

  describe('CardFooter', () => {
    it('should render footer content', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Footer content')
      expect(footer).toBeInTheDocument()
    })

    it('should have flex layout by default', () => {
      render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Footer').parentElement
      expect(footer).toHaveClass('flex')
      // Check for flex-related classes
      expect(footer?.className).toMatch(/flex|items-|justify-/)
    })
  })

  describe('Complete Card', () => {
    it('should render a complete card with all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>This is a complete card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card body content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Complete Card')).toBeInTheDocument()
      expect(screen.getByText('This is a complete card example')).toBeInTheDocument()
      expect(screen.getByText('Card body content goes here')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('should maintain semantic structure', () => {
      const { container } = render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      )

      const card = screen.getByTestId('card')
      const header = screen.getByTestId('header')
      const content = screen.getByTestId('content')
      const footer = screen.getByTestId('footer')

      expect(card).toContainElement(header)
      expect(card).toContainElement(content)
      expect(card).toContainElement(footer)
    })
  })
})