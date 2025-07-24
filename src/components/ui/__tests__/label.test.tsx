import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '../label';

describe('Label', () => {
  it('should render label element', () => {
    render(<Label>Test Label</Label>);
    
    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
  });

  it('should apply custom className', () => {
    render(<Label className="custom-class">Label</Label>);
    
    const label = screen.getByText('Label');
    expect(label).toHaveClass('custom-class');
  });

  it('should handle htmlFor prop', () => {
    render(<Label htmlFor="input-id">Label</Label>);
    
    const label = screen.getByText('Label');
    expect(label).toHaveAttribute('for', 'input-id');
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Label</Label>);
    
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('should render children', () => {
    render(
      <Label>
        <span>Child 1</span>
        <span>Child 2</span>
      </Label>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});