import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

type PaginationItem = number | 'ellipsis';

@Component({
  selector: 'gk-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  currentPage = input(1);
  pageSize = input(10);
  totalItems = input(0);
  siblingCount = input(1);

  pageChange = output<number>();

  totalPages = computed(() => {
    const size = this.pageSize();
    const total = this.totalItems();

    if (size <= 0) return 1;
    return Math.max(1, Math.ceil(total / size));
  });

  pageItems = computed<PaginationItem[]>(() => {
    const totalPages = this.totalPages();
    const currentPage = this.clampPage(this.currentPage());
    const siblingCount = Math.max(0, this.siblingCount());

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages]);

    for (let page = currentPage - siblingCount; page <= currentPage + siblingCount; page += 1) {
      if (page > 1 && page < totalPages) {
        pages.add(page);
      }
    }

    const sortedPages = [...pages].sort((a, b) => a - b);
    const items: PaginationItem[] = [];

    for (let index = 0; index < sortedPages.length; index += 1) {
      const page = sortedPages[index];
      const previousPage = sortedPages[index - 1];

      if (previousPage && page - previousPage > 1) {
        items.push('ellipsis');
      }

      items.push(page);
    }

    return items;
  });

  canGoPrevious = computed(() => this.clampPage(this.currentPage()) > 1);
  canGoNext = computed(() => this.clampPage(this.currentPage()) < this.totalPages());

  goToPage(page: PaginationItem): void {
    if (typeof page !== 'number') return;

    const nextPage = this.clampPage(page);
    if (nextPage === this.clampPage(this.currentPage())) return;

    this.pageChange.emit(nextPage);
  }

  goToPreviousPage(): void {
    if (!this.canGoPrevious()) return;
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    if (!this.canGoNext()) return;
    this.goToPage(this.currentPage() + 1);
  }

  isCurrentPage(page: PaginationItem): boolean {
    return typeof page === 'number' && page === this.clampPage(this.currentPage());
  }

  getPageButtonClasses(page: PaginationItem): string {
    const base =
      'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition';

    return this.isCurrentPage(page)
      ? `${base} border-blue-600 bg-blue-600 text-white`
      : `${base} border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700`;
  }

  trackPageItem(index: number, item: PaginationItem): string {
    return `${item}-${index}`;
  }

  private clampPage(page: number): number {
    return Math.min(Math.max(page, 1), this.totalPages());
  }
}
