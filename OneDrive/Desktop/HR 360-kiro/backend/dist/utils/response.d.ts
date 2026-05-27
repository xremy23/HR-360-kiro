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
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, code: string, message: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendPaginated: <T>(res: Response, data: T[], total: number, limit: number, offset: number, statusCode?: number) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map