"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const health_route_1 = __importDefault(require("./routes/health.route"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const adminProduct_routes_1 = __importDefault(require("./routes/adminProduct.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const app = (0, express_1.default)();
// Configure trust proxy for rate limiting
// TRUST_PROXY=0: No proxy (direct deployment) - DEFAULT
// TRUST_PROXY=1: Single trusted reverse proxy (e.g., Nginx)
// TRUST_PROXY=2: Two trusted reverse proxies
// TRUST_PROXY="loopback, 123.45.67.89": Explicit IP/subnet notation
// SECURITY: TRUST_PROXY=true is NOT allowed (rejects at startup)
app.set('trust proxy', env_1.env.TRUST_PROXY);
// Global Middlewares
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)(env_1.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
// Configure CORS
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    credentials: true,
}));
// Request Parsers with size limits
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
app.use((0, cookie_parser_1.default)());
// API Routes
app.use('/api', health_route_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/admin/products', adminProduct_routes_1.default);
// Not Found Route Handler
app.use(notFoundHandler_1.notFoundHandler);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
