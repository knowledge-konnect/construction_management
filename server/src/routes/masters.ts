import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../auth.js';
import {
    authorizeCompany,
    COMPANY_MANAGEMENT_ROLES,
    QUOTATION_ROLES,
} from '../authz.js';

const MASTER_TABLE_MAP: Record<string, string> = {
    projectTypes: 'project_types',
    units: 'units_of_measure',
    expenseCategories: 'expense_categories',
    paymentMethods: 'payment_methods',
    taxRates: 'tax_rates',
    stageTemplates: 'project_stage_templates',
};

function getMasterRowKey(table: string, row: any): string {
    if (table === 'project_stage_templates') {
        const key = String(row?.template_code ?? row?.code ?? row?.name ?? '').trim().toLowerCase();
        const projectTypeId = row?.project_type_id ?? 'global';
        return `${table}:${String(projectTypeId)}:${key}`;
    }
    const key = String(row?.code ?? '').trim().toLowerCase();
    return `${table}:${key}`;
}

function isMasterRowActive(row: any): boolean {
    if (!row || row.is_active === false) return false;
    return true;
}

function isTaxRateCurrent(row: any, todayIso: string): boolean {
    if (!row || row.is_active === false) return false;
    const effectiveFrom = String(row.effective_from ?? '').trim();
    const effectiveTo = String(row.effective_to ?? '').trim();
    if (effectiveFrom && effectiveFrom > todayIso) return false;
    if (effectiveTo && effectiveTo < todayIso) return false;
    return true;
}

function mergeMasterRows(rows: any[], table: string, companyId: string): any[] {
    const merged = new Map<string, any>();
    const todayIso = new Date().toISOString().slice(0, 10);

    for (const row of rows ?? []) {
        if (row?.company_id != null && row.company_id !== companyId) {
            continue;
        }
        if (!isMasterRowActive(row)) continue;
        if (table === 'tax_rates' && !isTaxRateCurrent(row, todayIso)) continue;

        const key = getMasterRowKey(table, row);
        const existing = merged.get(key);
        if (!existing || (row.company_id === companyId && existing.company_id !== companyId)) {
            merged.set(key, row);
        }
    }

    return Array.from(merged.values()).sort((a, b) => {
        if (table === 'tax_rates') {
            const aDate = new Date(String(a?.effective_from ?? '1970-01-01')).getTime();
            const bDate = new Date(String(b?.effective_from ?? '1970-01-01')).getTime();
            if (aDate !== bDate) return bDate - aDate;
        }

        const aSort = Number(a?.sort_order ?? a?.sequence_number ?? 0);
        const bSort = Number(b?.sort_order ?? b?.sequence_number ?? 0);
        if (aSort !== bSort) return aSort - bSort;
        if (table === 'project_stage_templates') {
            const aSeq = Number(a?.sequence_number ?? Number.MAX_SAFE_INTEGER);
            const bSeq = Number(b?.sequence_number ?? Number.MAX_SAFE_INTEGER);
            if (aSeq !== bSeq) return aSeq - bSeq;
        }
        const aLabel = String(a?.name ?? a?.code ?? a?.template_code ?? '').toLowerCase();
        const bLabel = String(b?.name ?? b?.code ?? b?.template_code ?? '').toLowerCase();
        return aLabel.localeCompare(bLabel);
    });
}

export function registerMasterRoutes(app: FastifyInstance) {
    app.get('/api/masters/:type', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const { type } = request.params as { type: string };
        const table = MASTER_TABLE_MAP[type];
        if (!table) return reply.status(404).send({ error: 'Master type not found.' });

        try {
            let query = supabaseAdmin.from(table).select('*').or(`company_id.eq.${membership.companyId},company_id.is.null`);
            if (table === 'tax_rates') query = query.order('effective_from', { ascending: false });
            else if (table === 'project_stage_templates') query = query.order('sequence_number', { ascending: true });
            else query = query.order('sort_order', { ascending: true });
            const { data, error } = await query;
            if (error) throw error;
            return reply.send({ items: mergeMasterRows(data ?? [], table, membership.companyId) });
        } catch (err: any) {
            app.log.error(err, 'Failed to load master data');
            return reply.status(500).send({ error: 'Failed to load master data.' });
        }
    });

    app.post('/api/masters/:type', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const { type } = request.params as { type: string };
        const body = request.body as any;
        const table = MASTER_TABLE_MAP[type];
        if (!table) return reply.status(404).send({ error: 'Master type not found.' });

        try {
            if (body?.company_id && body.company_id !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const payload = { ...body, company_id: body?.company_id ?? membership.companyId };
            if (table === 'tax_rates') {
                payload.code = String(payload.code ?? '').trim();
                payload.name = String(payload.name ?? '').trim();
                payload.rate_percentage = Number(payload.rate_percentage ?? payload.ratePercentage ?? 0);
                payload.effective_from = payload.effective_from ?? payload.effectiveFrom ?? null;
            }
            const { data, error } = await supabaseAdmin.from(table).insert(payload).select('*').single();
            if (error) throw error;
            return reply.status(201).send({ item: data });
        } catch (err: any) {
            app.log.error(err, 'Failed to create master data row');
            return reply.status(500).send({ error: 'Failed to create master data row.' });
        }
    });

    app.put('/api/masters/:type/:id', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const { type, id } = request.params as { type: string; id: string };
        const body = request.body as any;
        const table = MASTER_TABLE_MAP[type];
        if (!table) return reply.status(404).send({ error: 'Master type not found.' });

        try {
            if (body?.company_id && body.company_id !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const { data: existing, error: existingError } = await supabaseAdmin
                .from(table)
                .select('id, company_id')
                .eq('id', id)
                .maybeSingle();
            if (existingError) throw existingError;
            if (!existing) return reply.status(404).send({ error: 'Master row not found.' });
            if (existing.company_id !== membership.companyId) return reply.status(403).send({ error: 'Forbidden.' });

            const payload = { ...(body ?? {}), company_id: membership.companyId };
            const { data, error } = await supabaseAdmin.from(table).update(payload).eq('id', id).select('*').single();
            if (error) throw error;
            return reply.send({ item: data });
        } catch (err: any) {
            app.log.error(err, 'Failed to update master data row');
            return reply.status(500).send({ error: 'Failed to update master data row.' });
        }
    });

    app.delete('/api/masters/:type/:id', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const { type, id } = request.params as { type: string; id: string };
        const table = MASTER_TABLE_MAP[type];
        if (!table) return reply.status(404).send({ error: 'Master type not found.' });

        try {
            const { data: existing, error: existingError } = await supabaseAdmin
                .from(table)
                .select('id, company_id')
                .eq('id', id)
                .maybeSingle();
            if (existingError) throw existingError;
            if (!existing) return reply.status(404).send({ error: 'Master row not found.' });
            if (existing.company_id !== membership.companyId) return reply.status(403).send({ error: 'Forbidden.' });

            const { error } = await supabaseAdmin.from(table).update({ is_active: false }).eq('id', id);
            if (error) throw error;
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete master data row');
            return reply.status(500).send({ error: 'Failed to delete master data row.' });
        }
    });
}
