import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type RevealVariant = 'up' | 'left' | 'right' | 'zoom';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  @Input('appScrollReveal') variant: RevealVariant = 'up';
  @Input() revealDelay = 0;

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const element = this.elementRef.nativeElement;

    this.renderer.setAttribute(element, 'data-motion', 'reveal');
    this.renderer.addClass(element, `reveal-from-${this.variant}`);
    this.renderer.setStyle(element, '--reveal-delay', `${this.revealDelay}ms`);

    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      this.renderer.addClass(element, 'is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          this.renderer.addClass(element, 'is-visible');
          this.observer?.unobserve(element);
        }
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}