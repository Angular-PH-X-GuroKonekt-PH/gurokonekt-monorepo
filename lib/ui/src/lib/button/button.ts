import { Component, Input, Output, EventEmitter, computed } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gk-button',
  standalone: true,
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() fullWidth = false;
  
  @Output() buttonClick = new EventEmitter<MouseEvent>();
  
  buttonClasses = computed(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variantClasses = {
      primary: 'bg-primary-600 border-transparent text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
      outline: 'bg-transparent border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      danger: 'bg-red-600 border-transparent text-white hover:bg-red-700 focus:ring-red-500'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const widthClass = this.fullWidth ? 'w-full' : '';
    
    return `${baseClasses} ${variantClasses[this.variant]} ${sizeClasses[this.size]} ${widthClass}`.trim();
  });
  
  handleClick(event: MouseEvent): void {
    this.buttonClick.emit(event);
  }
}
