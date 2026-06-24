"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityReportsRoutes = exports.bulkImportRoutes = exports.chatbotRoutes = exports.superadminRoutes = exports.tobagRoutes = exports.organizationRoutes = exports.sosRoutes = exports.incidentsRoutes = exports.contactsRoutes = exports.alertsRoutes = exports.checkinsRoutes = exports.kbRoutes = exports.usersRoutes = exports.authRoutes = void 0;
// Central export file for all routes
var auth_1 = require("./auth");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(auth_1).default; } });
var users_1 = require("./users");
Object.defineProperty(exports, "usersRoutes", { enumerable: true, get: function () { return __importDefault(users_1).default; } });
var kb_1 = require("./kb");
Object.defineProperty(exports, "kbRoutes", { enumerable: true, get: function () { return __importDefault(kb_1).default; } });
var checkins_1 = require("./checkins");
Object.defineProperty(exports, "checkinsRoutes", { enumerable: true, get: function () { return __importDefault(checkins_1).default; } });
var alerts_1 = require("./alerts");
Object.defineProperty(exports, "alertsRoutes", { enumerable: true, get: function () { return __importDefault(alerts_1).default; } });
var contacts_1 = require("./contacts");
Object.defineProperty(exports, "contactsRoutes", { enumerable: true, get: function () { return __importDefault(contacts_1).default; } });
var incidents_1 = require("./incidents");
Object.defineProperty(exports, "incidentsRoutes", { enumerable: true, get: function () { return __importDefault(incidents_1).default; } });
var sos_1 = require("./sos");
Object.defineProperty(exports, "sosRoutes", { enumerable: true, get: function () { return __importDefault(sos_1).default; } });
var organization_1 = require("./organization");
Object.defineProperty(exports, "organizationRoutes", { enumerable: true, get: function () { return __importDefault(organization_1).default; } });
var tobag_1 = require("./tobag");
Object.defineProperty(exports, "tobagRoutes", { enumerable: true, get: function () { return __importDefault(tobag_1).default; } });
var superadmin_1 = require("./superadmin");
Object.defineProperty(exports, "superadminRoutes", { enumerable: true, get: function () { return __importDefault(superadmin_1).default; } });
var chatbot_1 = require("./chatbot");
Object.defineProperty(exports, "chatbotRoutes", { enumerable: true, get: function () { return __importDefault(chatbot_1).default; } });
var bulkImport_1 = require("./bulkImport");
Object.defineProperty(exports, "bulkImportRoutes", { enumerable: true, get: function () { return __importDefault(bulkImport_1).default; } });
var communityReports_1 = require("./communityReports");
Object.defineProperty(exports, "communityReportsRoutes", { enumerable: true, get: function () { return __importDefault(communityReports_1).default; } });
//# sourceMappingURL=index.js.map