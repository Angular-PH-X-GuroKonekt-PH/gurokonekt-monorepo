import { HttpException } from '@nestjs/common';
import { API_RESPONSE, ResponseStatus } from '@gurokonekt/models';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController.session', () => {
  let controller: AuthController;
  const getSession = jest.fn();

  beforeEach(() => {
    getSession.mockReset();
    controller = new AuthController({ getSession } as unknown as AuthService);
  });

  it('returns the service response as-is when the session is found', async () => {
    const successResponse = {
      status: ResponseStatus.Success,
      statusCode: 200,
      message: API_RESPONSE.SUCCESS.GET_SESSION.message,
      data: {
        id: 'user-1',
        email: 'jane@example.com',
        fullName: 'Jane Dela Cruz',
        role: 'mentor',
        isProfileComplete: true,
        isMentorProfileComplete: true,
      },
    };
    getSession.mockResolvedValue(successResponse);

    const result = await controller.session({ user: { id: 'user-1' } });

    expect(getSession).toHaveBeenCalledWith('user-1');
    expect(result).toBe(successResponse);
    // Exactly the six AuthUser fields — no more, no fewer.
    expect(Object.keys(result.data).sort()).toEqual(
      [
        'id',
        'email',
        'fullName',
        'role',
        'isProfileComplete',
        'isMentorProfileComplete',
      ].sort()
    );
  });

  it('throws an HttpException with the service status/body when the token subject no longer exists', async () => {
    getSession.mockResolvedValue({
      status: ResponseStatus.Error,
      statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
      message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
      data: null,
    });

    await expect(controller.session({ user: { id: 'ghost' } })).rejects.toThrow(
      HttpException
    );

    try {
      await controller.session({ user: { id: 'ghost' } });
      fail('expected session() to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(API_RESPONSE.ERROR.USER_NOT_FOUND.code);
      expect(error.getResponse()).toEqual({
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
        message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
        data: null,
      });
    }
  });
});
