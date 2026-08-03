import { Test, TestingModule } from '@nestjs/testing';
import { API_RESPONSE, ResponseStatus } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecaptchaFailureReason,
  RecaptchaService,
} from '../recaptcha/recaptcha.service';
import { PublicInquiryService } from './public-inquiry.service';

const VALID_DTO = {
  email: 'maria@example.com',
  fullName: 'Maria Santos',
  topic: 'Becoming a mentor',
  message: 'I would like to know how to apply as a mentor.',
  recaptchaToken: 'token-123',
};

const CREATED_ROW = {
  id: 'inquiry-1',
  createdAt: new Date('2026-08-03T14:25:37.000Z'),
};

describe('PublicInquiryService', () => {
  let service: PublicInquiryService;
  let prisma: { db: { inquiry: { create: jest.Mock } } };
  let recaptcha: { verify: jest.Mock };

  beforeEach(async () => {
    prisma = { db: { inquiry: { create: jest.fn() } } };
    recaptcha = { verify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicInquiryService,
        { provide: PrismaService, useValue: prisma },
        { provide: RecaptchaService, useValue: recaptcha },
      ],
    }).compile();

    service = module.get(PublicInquiryService);
    prisma.db.inquiry.create.mockResolvedValue(CREATED_ROW);
    recaptcha.verify.mockResolvedValue({ ok: true });
  });

  it('stores a verified submission', async () => {
    const result = await service.createInquiry(VALID_DTO);

    expect(result.status).toBe(ResponseStatus.Success);
    expect(result.statusCode).toBe(API_RESPONSE.SUCCESS.CREATE_INQUIRY.code);
    expect(prisma.db.inquiry.create).toHaveBeenCalledWith({
      data: {
        email: 'maria@example.com',
        fullName: 'Maria Santos',
        topic: 'Becoming a mentor',
        message: 'I would like to know how to apply as a mentor.',
      },
      select: expect.any(Object),
    });
  });

  it('never persists the reCAPTCHA token', async () => {
    await service.createInquiry(VALID_DTO);

    const data = prisma.db.inquiry.create.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('recaptchaToken');
  });

  it('returns only the id and timestamp', async () => {
    const result = await service.createInquiry(VALID_DTO);

    expect(result.data).toEqual({
      id: 'inquiry-1',
      createdAt: '2026-08-03T14:25:37.000Z',
    });
  });

  it('trims surrounding whitespace', async () => {
    await service.createInquiry({
      ...VALID_DTO,
      fullName: '  Maria Santos  ',
      topic: ' Becoming a mentor ',
      message: '  I would like to know how to apply.  ',
      email: '  maria@example.com ',
    });

    const data = prisma.db.inquiry.create.mock.calls[0][0].data;
    expect(data.fullName).toBe('Maria Santos');
    expect(data.topic).toBe('Becoming a mentor');
    expect(data.message).toBe('I would like to know how to apply.');
    expect(data.email).toBe('maria@example.com');
  });

  it('rejects and does not store when reCAPTCHA fails', async () => {
    recaptcha.verify.mockResolvedValue({
      ok: false,
      reason: RecaptchaFailureReason.LowScore,
    });

    const result = await service.createInquiry(VALID_DTO);

    expect(result.status).toBe(ResponseStatus.Error);
    expect(result.statusCode).toBe(API_RESPONSE.ERROR.RECAPTCHA_FAILED.code);
    expect(prisma.db.inquiry.create).not.toHaveBeenCalled();
  });

  it('maps an invalid token to the same user-facing rejection', async () => {
    recaptcha.verify.mockResolvedValue({
      ok: false,
      reason: RecaptchaFailureReason.Rejected,
    });

    const result = await service.createInquiry(VALID_DTO);

    expect(result.statusCode).toBe(API_RESPONSE.ERROR.RECAPTCHA_FAILED.code);
  });

  // An outage is not the visitor's fault and should read differently to "you
  // look like a bot".
  it('maps a verification outage to 502', async () => {
    recaptcha.verify.mockResolvedValue({
      ok: false,
      reason: RecaptchaFailureReason.Unavailable,
    });

    const result = await service.createInquiry(VALID_DTO);

    expect(result.statusCode).toBe(
      API_RESPONSE.ERROR.RECAPTCHA_UNAVAILABLE.code,
    );
    expect(prisma.db.inquiry.create).not.toHaveBeenCalled();
  });

  it('maps a missing server secret to 500', async () => {
    recaptcha.verify.mockResolvedValue({
      ok: false,
      reason: RecaptchaFailureReason.NotConfigured,
    });

    const result = await service.createInquiry(VALID_DTO);

    expect(result.statusCode).toBe(
      API_RESPONSE.ERROR.RECAPTCHA_NOT_CONFIGURED.code,
    );
  });

  it('returns an error response instead of throwing when Prisma fails', async () => {
    prisma.db.inquiry.create.mockRejectedValue(new Error('db down'));

    const result = await service.createInquiry(VALID_DTO);

    expect(result.status).toBe(ResponseStatus.Error);
    expect(result.statusCode).toBe(API_RESPONSE.ERROR.CREATE_INQUIRY.code);
  });
});
