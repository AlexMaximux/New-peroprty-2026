import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ZodError, type ZodIssue } from 'zod';

/**
 * Global exception filter catching unhandled ZodError and returning HTTP 400
 * with a clean JSON body listing offending fields and messages.
 *
 * Registered in main.ts via app.useGlobalFilters(new ZodExceptionFilter()).
 */
@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: exception.issues.map((e: ZodIssue) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }
}