import { ZodExceptionFilter } from './zod-exception.filter';
import { ZodError, z } from 'zod';
import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

describe('ZodExceptionFilter', () => {
  let filter: ZodExceptionFilter;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    filter = new ZodExceptionFilter();

    const jsonFn = jest.fn();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jsonFn,
    };
  });

  it('should catch ZodError and return 400 with field-level details', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().min(0),
    });

    let zodError: ZodError | null = null;
    try {
      schema.parse({ name: '', age: -1 });
    } catch (err) {
      zodError = err as ZodError;
    }

    expect(zodError).toBeInstanceOf(ZodError);

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => ({}),
      }),
      getArgs: () => [],
      getArgByIndex: () => ({}),
    } as any;

    filter.catch(zodError!, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'name',
            message: expect.stringContaining(''),
          }),
          expect.objectContaining({
            path: 'age',
            message: expect.stringContaining(''),
          }),
        ]),
      }),
    );
  });

  it('should include offending field paths in details array', () => {
    const schema = z.object({
      hmoRooms: z.array(
        z.object({ name: z.string().min(1) }),
      ),
    });

    let zodError: ZodError | null = null;
    try {
      schema.parse({ hmoRooms: [{ name: '' }] });
    } catch (err) {
      zodError = err as ZodError;
    }

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => ({}),
      }),
      getArgs: () => [],
      getArgByIndex: () => ({}),
    } as any;

    filter.catch(zodError!, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'hmoRooms.0.name',
            message: 'String must contain at least 1 character(s)',
          }),
        ]),
      }),
    );
  });
});