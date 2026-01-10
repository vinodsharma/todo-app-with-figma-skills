import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SelectionCheckbox } from '../SelectionCheckbox';

describe('SelectionCheckbox', () => {
  it('should render unchecked state', () => {
    render(<SelectionCheckbox checked={false} onChange={() => {}} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should render checked state with checkmark', () => {
    render(<SelectionCheckbox checked={true} onChange={() => {}} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onChange when clicked', () => {
    const onChange = vi.fn();
    render(<SelectionCheckbox checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should pass event modifiers to onChange', () => {
    const onChange = vi.fn();
    render(<SelectionCheckbox checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox'), { shiftKey: true });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ shiftKey: true }));
  });

  it('should have circular shape styling', () => {
    render(<SelectionCheckbox checked={false} onChange={() => {}} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('rounded-full');
  });
});
