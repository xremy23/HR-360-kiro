import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  statusCode?: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Operation successful',
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
    statusCode,
  });
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  limit: number,
  offset: number,
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit),
    },
  });
};
