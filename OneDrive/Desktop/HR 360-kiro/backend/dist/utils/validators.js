"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRole = exports.validateAlertSeverity = exports.validateCheckInStatus = exports.validateUUID = exports.validateCoordinates = exports.validatePhoneNumber = exports.validateEmail = void 0;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};
exports.validatePhoneNumber = validatePhoneNumber;
const validateCoordinates = (lat, lon) => {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};
exports.validateCoordinates = validateCoordinates;
const validateUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.validateUUID = validateUUID;
const validateCheckInStatus = (status) => {
    return ['safe', 'need_help', 'sos'].includes(status);
};
exports.validateCheckInStatus = validateCheckInStatus;
const validateAlertSeverity = (severity) => {
    return ['advisory', 'watch', 'emergency'].includes(severity);
};
exports.validateAlertSeverity = validateAlertSeverity;
const validateRole = (role) => {
    return ['admin', 'hr', 'manager', 'employee'].includes(role);
};
exports.validateRole = validateRole;
//# sourceMappingURL=validators.js.map