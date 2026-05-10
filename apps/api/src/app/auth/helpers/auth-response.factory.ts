import { ResponseStatus, API_RESPONSE, ResponseDto } from '@gurokonekt/models';

/**
 * Factory for building standardized API responses
 * Centralizes response structure and reduces boilerplate
 */
export class AuthResponseFactory {
  static success<T>(
    statusCode: number,
    message: string,
    data?: T
  ): ResponseDto {
    return {
      status: ResponseStatus.Success,
      statusCode,
      message,
      data: data || null,
    };
  }

  static error(
    statusCode: number,
    message: string,
    data?: any
  ): ResponseDto {
    return {
      status: ResponseStatus.Error,
      statusCode,
      message,
      data: data || null,
    };
  }

  static errorByKey(errorKey: keyof typeof API_RESPONSE.ERROR, data?: any): ResponseDto {
    const error = API_RESPONSE.ERROR[errorKey];
    return this.error(error.code, error.message, data);
  }

  static successByKey<T>(
    successKey: keyof typeof API_RESPONSE.SUCCESS,
    data?: T
  ): ResponseDto {
    const success = API_RESPONSE.SUCCESS[successKey];
    return this.success(success.code, success.message, data);
  }
}
