export enum ResponseStatus {
    Success = "success",
    Error = "error",
    Warning = "warning",
    Info = "info"
}

export interface ResponseInterface<T = unknown> {
    status: ResponseStatus,
    statusCode: number,
    message: string,
    data: T | null
}