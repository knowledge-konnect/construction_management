import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { sanitizeUserFacingError } from './routeHelpers.js';

// ─── Route registrations ─────────────────────────────────────────────────────
import { registerAuthRoutes } from './routes/auth.js';
import { registerCompanyRoutes } from './routes/company.js';
import { registerCustomerRoutes } from './routes/customers.js';
import { registerFlatBillingRoutes } from './routes/flatBilling.js';
import { registerInvoiceRoutes } from './routes/invoices.js';
import { registerMasterRoutes } from './routes/masters.js';
import { registerPartyRoutes } from './routes/parties.js';
import { registerProjectResourceRoutes } from './routes/projectResources.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerQuotationRoutes } from './routes/quotations.js';
import { registerReceiptRoutes } from './routes/receipts.js';
import { registerReportRoutes } from './routes/reports.js';
import { registerSubscriptionRoutes } from './routes/subscription.js';
import { registerSupplierRoutes } from './routes/suppliers.js';
import { registerTeamRoutes } from './routes/team.js';

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 }); // 10 MB

// ─── Error sanitization hook ─────────────────────────────────────────────────
app.addHook('preSerialization', async (_request, reply, payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
    const nextPayload = payload as Record<string, unknown>;
    if (typeof nextPayload.error === 'string') {
        nextPayload.error = sanitizeUserFacingError(nextPayload.error, reply.statusCode);
    }
    return nextPayload;
});

// ─── Raw body capture for Razorpay webhook signature ─────────────────────────
// The Razorpay webhook (POST /api/webhooks/razorpay) signature is computed
// over the exact raw bytes Razorpay sent. Re-stringifying the parsed object
// would not reproduce them reliably, so we stash the raw buffer alongside.
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    (request as any).rawBody = body;
    if (!body || body.length === 0) {
        done(null, {});
        return;
    }
    try {
        done(null, JSON.parse(body.toString('utf8')));
    } catch (err) {
        done(err as Error, undefined);
    }
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
if (!process.env.ALLOWED_ORIGINS) {
    app.log.warn('ALLOWED_ORIGINS is not set — CORS is only allowing http://localhost:5173. Set it in .env for any other frontend origin.');
}

await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
});

await app.register(helmet, {
    contentSecurityPolicy: false,
});

await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
});

// ─── Register all route domains ───────────────────────────────────────────────
registerAuthRoutes(app);
registerCompanyRoutes(app);
registerPartyRoutes(app);
registerCustomerRoutes(app);
registerInvoiceRoutes(app);
registerReceiptRoutes(app);
registerSupplierRoutes(app);
registerProjectRoutes(app);
registerProjectResourceRoutes(app);
registerMasterRoutes(app);
registerReportRoutes(app);
registerTeamRoutes(app);
registerSubscriptionRoutes(app);
registerFlatBillingRoutes(app);
registerQuotationRoutes(app);

// ─── Health endpoint ──────────────────────────────────────────────────────────
app.get('/api/health', async () => ({ ok: true, time: new Date().toISOString(), uptime: process.uptime() }));

// ─── Server start ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 4000;
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Server listening at ${address}`);
});
