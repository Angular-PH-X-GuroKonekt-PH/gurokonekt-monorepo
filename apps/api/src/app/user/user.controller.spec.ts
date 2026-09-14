import { HttpException } from '@nestjs/common';
import { API_RESPONSE, ResponseStatus } from '@gurokonekt/models';

import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController.getUserDashboard', () => {
  const getUserDashboard = jest.fn();
  let controller: UserController;

  beforeEach(() => {
    getUserDashboard.mockReset();
    controller = new UserController({
      getUserDashboard,
    } as unknown as UserService);
  });

  it('uses the authenticated user identity', async () => {
    const response = {
      status: ResponseStatus.Success,
      statusCode: 200,
      message: 'Dashboard retrieved',
      data: {},
    };
    getUserDashboard.mockResolvedValue(response);

    const result = await controller.getUserDashboard(
      'user-1',
      '127.0.0.1',
      'test-agent',
      { user: { id: 'user-1' } } as never,
    );

    expect(getUserDashboard).toHaveBeenCalledWith(
      'user-1',
      '127.0.0.1',
      'test-agent',
    );
    expect(result).toBe(response);
  });

  it('rejects access to another user dashboard', async () => {
    let error: HttpException | undefined;

    try {
      await controller.getUserDashboard('user-2', '127.0.0.1', 'test-agent', {
        user: { id: 'user-1' },
      } as never);
    } catch (caught) {
      error = caught as HttpException;
    }

    expect(error).toBeInstanceOf(HttpException);
    expect(error?.getStatus()).toBe(403);
    expect(error?.getResponse()).toEqual({
      status: ResponseStatus.Error,
      statusCode: API_RESPONSE.ERROR.USER_ACCESS_DENIED.code,
      message: API_RESPONSE.ERROR.USER_ACCESS_DENIED.message,
      data: null,
    });
    expect(getUserDashboard).not.toHaveBeenCalled();
  });
});
