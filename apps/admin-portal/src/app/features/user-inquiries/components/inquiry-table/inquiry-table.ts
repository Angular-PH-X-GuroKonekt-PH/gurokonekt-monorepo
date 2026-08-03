import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  InquiriesQueryParams,
  InquiryListItem,
  UserInquiriesService,
} from '../../services/user-inquiries.service';
import { SortableHeaderComponent } from '../../../../shared/components/sortable-header/sortable-header.component';
import { ToastService } from '../../../../shared/services/toast.service';

type SortField = NonNullable<InquiriesQueryParams['sortBy']>;

const DEFAULT_SORT_FIELD: SortField = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc' as const;

@Component({
  selector: 'app-inquiry-table',
  imports: [DatePipe, SortableHeaderComponent],
  templateUrl: './inquiry-table.html',
})
export class InquiryTableComponent implements OnInit, OnDestroy {
  private readonly inquiriesService = inject(UserInquiriesService);
  private readonly toast = inject(ToastService);
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  protected inquiries = signal<InquiryListItem[]>([]);
  protected isLoading = signal(false);
  protected total = signal(0);
  protected totalPages = signal(0);
  protected page = signal(1);
  protected readonly limit = 20;

  protected search = signal('');
  protected dateFrom = signal('');
  protected dateTo = signal('');

  // null means no explicit sort, so the default is used
  protected sortBy = signal<SortField | null>(null);
  protected sortOrder = signal<'asc' | 'desc'>(DEFAULT_SORT_ORDER);

  /** Id of the row whose full message is expanded, if any. */
  protected expandedId = signal<string | null>(null);

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.search.set(value);
        this.page.set(1);
        this.loadInquiries();
      });
  }

  ngOnInit(): void {
    this.loadInquiries();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected loadInquiries(): void {
    this.isLoading.set(true);
    const params: InquiriesQueryParams = {
      sortBy: this.sortBy() ?? DEFAULT_SORT_FIELD,
      sortOrder: this.sortBy() ? this.sortOrder() : DEFAULT_SORT_ORDER,
      page: this.page(),
      limit: this.limit,
      ...(this.search() && { search: this.search() }),
      ...(this.dateFrom() && { dateFrom: this.dateFrom() }),
      ...(this.dateTo() && { dateTo: this.dateTo() }),
    };

    this.inquiriesService.getInquiries(params).subscribe({
      next: (res) => {
        if (res.data) {
          this.inquiries.set(res.data.data);
          this.total.set(res.data.total);
          this.totalPages.set(res.data.totalPages);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Could not load inquiries. Please try again.');
      },
    });
  }

  protected onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  protected onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.page.set(1);
    this.loadInquiries();
  }

  protected onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.page.set(1);
    this.loadInquiries();
  }

  /** Cycles the clicked column: ascending -> descending -> cleared. */
  protected onSort(field: string): void {
    const next = field as SortField;
    if (this.sortBy() !== next) {
      this.sortBy.set(next);
      this.sortOrder.set('asc');
    } else if (this.sortOrder() === 'asc') {
      this.sortOrder.set('desc');
    } else {
      this.sortBy.set(null);
      this.sortOrder.set(DEFAULT_SORT_ORDER);
    }
    this.page.set(1);
    this.loadInquiries();
  }

  protected onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadInquiries();
  }

  protected toggleExpanded(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }
}
