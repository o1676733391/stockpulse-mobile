import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let detail = 'An unexpected server error occurred';
    let errorCode = 'ERR_INTERNAL_SERVER_ERROR';
    let invalidParams: unknown = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, any>;
      detail = resp.message || detail;
      errorCode = resp.error || `ERR_HTTP_${status}`;
      if (Array.isArray(resp.message)) {
        invalidParams = resp.message;
        detail = 'Request payload validation failed';
        errorCode = 'ERR_VALIDATION_FAILED';
      }
    } else if (typeof exceptionResponse === 'string') {
      detail = exceptionResponse;
    } else if (exception instanceof Error) {
      detail = exception.message;
    }

    const problemDetails = {
      type: `https://api.stockpulse.io/errors/${status}`,
      title: HttpStatus[status] || 'Error',
      status,
      detail,
      instance: request.url,
      errorCode,
      invalidParams,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - Error: ${detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - ${detail}`,
      );
    }

    response.status(status).json(problemDetails);
  }
}
