import { Test, TestingModule } from '@nestjs/testing';
import { API_RESPONSE, ResponseStatus } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { AdminInquiryService } from './admin-inquiry.service';

const buildRow = (overrides = {}) => ({
  id: 'inquiry-1',
  fullName: 'Maria Santos',
  email: 'maria@example.com',
  topic: 'Becoming a mentor',
  message: 'I would like to know how to apply as a mentor.',
  createdAt: new Date('2026-08-03T14:25:37.000Z'),
  ...overrides,
});

describe('AdminInquiryService', () => {
  let service: AdminInquiryService;
  let prisma: { db: { inquiry: { findMany: jest.Mock; count: jest.Mock } } };

  beforeEach(async () => {
    prisma = { db: { inquiry: { findMany: jest.fn(), count: jest.fn() } } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminInquiryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AdminInquiryService);
    prisma.db.inquiry.findMany.mockResolvedValue([buildRow()]);
    prisma.db.inquiry.count.mockResolvedValue(1);
  });

  const findManyArgs = () => prisma.db.inquiry.findMany.mock.calls[0][0];

  it('defaults to newest first, page 1, 20 per page', async () => {
    await service.getInquiries({});

    const args = findManyArgs();
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
    expect(args.skip).toBe(0);
    expect(args.take).toBe(20);
  });

  it('applies pagination', async () => {
    await service.getInquiries({ page: 3, limit: 10 });

    const args = findManyArgs();
    expect(args.skip).toBe(20);
    expect(args.take).toBe(10);
  });

  it('applies the requested sort field and order', async () => {
    await service.getInquiries({ sortBy: 'fullName', sortOrder: 'asc' });

    expect(findManyArgs().orderBy).toEqual({ fullName: 'asc' });
  });

  it('searches case-insensitively across name, email and subject', async () => {
    await service.getInquiries({ search: '  mentor ' });

    expect(findManyArgs().where.OR).toEqual([
      { fullName: { contains: 'mentor', mode: 'insensitive' } },
      { email: { contains: 'mentor', mode: 'insensitive' } },
      { topic: { contains: 'mentor', mode: 'insensitive' } },
    ]);
  });

  it('ignores a whitespace-only search', async () => {
    await service.getInquiries({ search: '   ' });

    expect(findManyArgs().where.OR).toBeUndefined();
  });

  it('bounds results by the requested date range', async () => {
    await service.getInquiries({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });

    expect(findManyArgs().where.createdAt).toEqual({
      gte: new Date('2026-01-01'),
      lte: new Date('2026-12-31'),
    });
  });

  it('serialises rows and returns pagination metadata', async () => {
    prisma.db.inquiry.count.mockResolvedValue(45);

    const result = await service.getInquiries({ page: 2, limit: 20 });

    expect(result.status).toBe(ResponseStatus.Success);
    expect(result.statusCode).toBe(API_RESPONSE.SUCCESS.ADMIN_GET_INQUIRIES.code);
    const data = result.data as any;
    expect(data.total).toBe(45);
    expect(data.totalPages).toBe(3);
    expect(data.page).toBe(2);
    expect(data.data[0].createdAt).toBe('2026-08-03T14:25:37.000Z');
  });

  it('returns success with an empty array when there are no inquiries', async () => {
    prisma.db.inquiry.findMany.mockResolvedValue([]);
    prisma.db.inquiry.count.mockResolvedValue(0);

    const result = await service.getInquiries({});

    expect(result.status).toBe(ResponseStatus.Success);
    expect((result.data as any).data).toEqual([]);
    expect((result.data as any).totalPages).toBe(0);
  });

  it('returns an error response instead of throwing when Prisma fails', async () => {
    prisma.db.inquiry.findMany.mockRejectedValue(new Error('db down'));

    const result = await service.getInquiries({});

    expect(result.status).toBe(ResponseStatus.Error);
    expect(result.statusCode).toBe(API_RESPONSE.ERROR.ADMIN_GET_INQUIRIES.code);
  });
});
