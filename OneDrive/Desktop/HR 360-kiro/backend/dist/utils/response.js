"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, code, message, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
        },
        statusCode,
    });
};
exports.sendError = sendError;
const sendPaginated = (res, data, total, limit, offset, statusCode = 200) => {
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
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=response.js.map