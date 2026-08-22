import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationsService } from '../../services/notifications.service';
import { NotificationsPage } from './notifications.page';

describe('NotificationsPage', () => {
  let component: NotificationsPage;
  let fixture: ComponentFixture<NotificationsPage>;
  let notificationsService: {
    broadcast: ReturnType<typeof vi.fn>;
    listAnnouncements: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    notificationsService = {
      broadcast: vi.fn(),
      listAnnouncements: vi.fn().mockReturnValue(
        of({
          status: 'success',
          data: {
            data: [
              {
                id: 'announcement-1',
                title: 'Platform Maintenance',
                message: 'The platform will be unavailable tonight.',
                recipientCount: 24,
                createdAt: '2026-08-02T12:00:00.000Z',
              },
            ],
            total: 24,
            page: 1,
            limit: 10,
            totalPages: 3,
          },
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationsPage],
      providers: [
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and displays sent announcement summaries', () => {
    expect(notificationsService.listAnnouncements).toHaveBeenCalledWith({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
    expect(fixture.nativeElement.textContent).toContain('Sent announcements');
    expect(fixture.nativeElement.textContent).toContain('Platform Maintenance');
    expect(fixture.nativeElement.textContent).toContain('24 recipients');
  });

  it('reloads the sent announcement list after a successful broadcast', () => {
    notificationsService.broadcast.mockReturnValue(
      of({ status: 'success', data: { sent: 24 } }),
    );
    component['title'].set('Platform Maintenance');
    component['message'].set('The platform will be unavailable tonight.');

    component['onSubmit']();

    expect(notificationsService.listAnnouncements).toHaveBeenCalledTimes(2);
  });

  it('reloads from the first page when a search or sort is changed', () => {
    component['announcementPage'].set(2);

    component['updateAnnouncementSearch']('maintenance');
    component['updateAnnouncementSort']('title:asc');

    expect(component['announcementPage']()).toBe(1);
    expect(notificationsService.listAnnouncements).toHaveBeenLastCalledWith({
      search: 'maintenance',
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: 'title',
      sortOrder: 'asc',
      page: 1,
      limit: 10,
    });
  });

  it('loads the selected pagination page', () => {
    component['changeAnnouncementPage'](2);

    expect(notificationsService.listAnnouncements).toHaveBeenLastCalledWith({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 2,
      limit: 10,
    });
  });
});
