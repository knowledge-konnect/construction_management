import type { FastifyInstance } from 'fastify';
import {
    authorizeCompany,
    authorizeOwnedResource,
    COMPANY_MANAGEMENT_ROLES,
    QUOTATION_ROLES,
} from '../authz.js';
import {
    createInvestorContributionForInvestor,
    createProjectAttachmentForProject,
    createProjectClientAccessForProject,
    createProjectExpensePaymentForExpense,
    createProjectInvestorForProject,
    createProjectProgressUpdateForProject,
    createProjectStageForProject,
    deleteInvestorContributionRow,
    deleteProjectAttachmentRow,
    deleteProjectInvestorRow,
    deleteProjectProgressUpdateRow,
    deleteProjectStageRow,
    getInvestorContributionRowById,
    getProjectCompanyId,
    getProjectExpensePaymentRowById,
    getProjectInvestorCompanyIdById,
    getProjectInvestorRowById,
    getProjectProgressUpdateRowById,
    getProjectRowById,
    getProjectStageRowById,
    listInvestorContributionsForInvestor,
    listProjectAttachmentsForProject,
    listProjectClientAccessForProject,
    listProjectExpensePaymentsForExpense,
    listProjectInvestorsForProject,
    listProjectProgressUpdatesForProject,
    listProjectStagesForProject,
    revokeProjectClientAccessRow,
    updateInvestorContributionRow,
    updateProjectExpensePaymentRow,
    updateProjectInvestorRow,
    updateProjectProgressUpdateRow,
    updateProjectStageRow,
    voidProjectExpensePaymentRow,
} from '../projects.js';
import {
    cancelPurchaseOrder,
    createPurchaseOrderForProject,
    getPurchaseOrderById,
    listPurchaseOrdersForProject,
    updatePurchaseOrderForProject,
    updatePurchaseOrderStatus,
} from '../purchaseOrders.js';
import {
    createMaterialReceiptForProject,
    deleteMaterialReceiptForProject,
    getMaterialReceiptById,
    listMaterialReceiptsForProject,
} from '../materialReceipts.js';
import { getProjectScopedAccessForRead } from '../routeHelpers.js';

export function registerProjectResourceRoutes(app: FastifyInstance) {
    // ─── Stages ────────────────────────────────────────────────────────────────
    app.get('/api/project-stages', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (membership) {
            const projectId = (request.query as { projectId?: string }).projectId;
            if (!projectId) {
                return reply.status(400).send({ error: 'Project is required.' });
            }

            try {
                const companyProjectId = await getProjectCompanyId(projectId);
                if (!companyProjectId || companyProjectId !== membership.companyId) {
                    return reply.status(403).send({ error: 'Forbidden.' });
                }

                const stages = await listProjectStagesForProject(projectId, membership.companyId);
                return reply.send({ stages });
            } catch (err: any) {
                app.log.error(err, 'Failed to list project stages');
                return reply.status(500).send({ error: 'Failed to load project stages.' });
            }
        }

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project stages', projectId);
        if (!projectScope) return;

        const project = await getProjectRowById(projectId);
        if (!project) {
            return reply.status(404).send({ error: 'Project not found.' });
        }

        const stages = await listProjectStagesForProject(projectId, project.company_id);
        return reply.send({ stages });
    });

    app.post('/api/project-stages', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const body = request.body as { stage?: any };
        const payload = body?.stage ?? body;
        if (!payload?.projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }

        try {
            const result = await createProjectStageForProject(payload.projectId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ stage: result });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project stage');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to save project stage.' });
        }
    });

    app.put('/api/project-stages/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as { stage?: any };
        const payload = body?.stage ?? body;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectStageRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const result = await updateProjectStageRow(id, membership.companyId, payload ?? {});
            return reply.send({ stage: result });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project stage');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update project stage.' });
        }
    });

    app.delete('/api/project-stages/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectStageRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            await deleteProjectStageRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project stage');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to delete project stage.' });
        }
    });

    // ─── Progress updates ──────────────────────────────────────────────────────
    app.get('/api/project-progress-updates', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (membership) {
            const projectId = (request.query as { projectId?: string }).projectId;
            if (!projectId) {
                return reply.status(400).send({ error: 'Project is required.' });
            }

            try {
                const companyProjectId = await getProjectCompanyId(projectId);
                if (!companyProjectId || companyProjectId !== membership.companyId) {
                    return reply.status(403).send({ error: 'Forbidden.' });
                }

                const updates = await listProjectProgressUpdatesForProject(projectId, membership.companyId);
                return reply.send({ updates });
            } catch (err: any) {
                app.log.error(err, 'Failed to list project progress updates');
                return reply.status(500).send({ error: 'Failed to load site updates.' });
            }
        }

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project progress updates', projectId);
        if (!projectScope) return;

        const project = await getProjectRowById(projectId);
        if (!project) {
            return reply.status(404).send({ error: 'Project not found.' });
        }

        const updates = await listProjectProgressUpdatesForProject(projectId, project.company_id);
        return reply.send({ updates });
    });

    app.post('/api/project-progress-updates', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const body = request.body as { update?: any };
        const payload = body?.update ?? body;
        if (!payload?.projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }

        try {
            const result = await createProjectProgressUpdateForProject(payload.projectId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ update: result });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project progress update');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to save site update.' });
        }
    });

    app.put('/api/project-progress-updates/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as { update?: any };
        const payload = body?.update ?? body;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectProgressUpdateRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const result = await updateProjectProgressUpdateRow(id, membership.companyId, payload ?? {});
            return reply.send({ update: result });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project progress update');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update site update.' });
        }
    });

    app.delete('/api/project-progress-updates/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectProgressUpdateRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            await deleteProjectProgressUpdateRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project progress update');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to delete site update.' });
        }
    });

    // ─── Attachments ───────────────────────────────────────────────────────────
    app.get('/api/project-attachments', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (membership) {
            const projectId = (request.query as { projectId?: string }).projectId;
            if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

            try {
                const attachments = await listProjectAttachmentsForProject(projectId, membership.companyId);
                return reply.send({ attachments });
            } catch (err: any) {
                app.log.error(err, 'Failed to list project attachments');
                return reply.status(500).send({ error: 'Failed to load project attachments.' });
            }
        }

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) return reply.status(400).send({ error: 'Project is required.' });
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project attachments', projectId);
        if (!projectScope) return;

        const project = await getProjectRowById(projectId);
        if (!project) {
            return reply.status(404).send({ error: 'Project not found.' });
        }

        const attachments = await listProjectAttachmentsForProject(projectId, project.company_id);
        return reply.send({ attachments });
    });

    app.post('/api/project-attachments', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const body = request.body as { attachment?: any };
        const payload = body?.attachment ?? body;
        if (!payload?.projectId) return reply.status(400).send({ error: 'Project is required.' });

        try {
            const attachment = await createProjectAttachmentForProject(payload.projectId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ attachment });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project attachment');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to save project attachment.' });
        }
    });

    app.delete('/api/project-attachments/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        try {
            await deleteProjectAttachmentRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project attachment');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to delete project attachment.' });
        }
    });

    // ─── Client access ─────────────────────────────────────────────────────────
    app.get('/api/project-client-access', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

        try {
            const access = await listProjectClientAccessForProject(projectId, membership.companyId);
            return reply.send({ access });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project client access');
            return reply.status(500).send({ error: 'Failed to load project client access.' });
        }
    });

    app.post('/api/project-client-access', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const body = request.body as { access?: any };
        const payload = body?.access ?? body;
        if (!payload?.projectId) return reply.status(400).send({ error: 'Project is required.' });

        try {
            const access = await createProjectClientAccessForProject(payload.projectId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ access });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project client access');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to create project client access.' });
        }
    });

    app.delete('/api/project-client-access/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            await revokeProjectClientAccessRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to revoke project client access');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to revoke project client access.' });
        }
    });

    // ─── Expense payments ──────────────────────────────────────────────────────
    app.get('/api/project-expense-payments', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const projectExpenseId = (request.query as { projectExpenseId?: string }).projectExpenseId;
        if (!projectExpenseId) return reply.status(400).send({ error: 'Supplier bill is required.' });

        try {
            const payments = await listProjectExpensePaymentsForExpense(projectExpenseId, membership.companyId);
            return reply.send({ payments });
        } catch (err: any) {
            app.log.error(err, 'Failed to list supplier payments');
            return reply.status(500).send({ error: 'Failed to load supplier payments.' });
        }
    });

    app.post('/api/project-expense-payments', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const body = request.body as { payment?: any };
        const payload = body?.payment ?? body;
        if (!payload?.projectExpenseId) return reply.status(400).send({ error: 'Supplier bill is required.' });

        try {
            const payment = await createProjectExpensePaymentForExpense(payload.projectExpenseId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ payment });
        } catch (err: any) {
            app.log.error(err, 'Failed to create supplier payment');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to save supplier payment.' });
        }
    });

    app.put('/api/project-expense-payments/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as { payment?: any };
        const payload = body?.payment ?? body;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectExpensePaymentRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            const payment = await updateProjectExpensePaymentRow(id, membership.companyId, payload ?? {});
            return reply.send({ payment });
        } catch (err: any) {
            app.log.error(err, 'Failed to update supplier payment');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to update supplier payment.' });
        }
    });

    app.delete('/api/project-expense-payments/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectExpensePaymentRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            await voidProjectExpensePaymentRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete supplier payment');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to delete supplier payment.' });
        }
    });

    // ─── Investors ─────────────────────────────────────────────────────────────
    app.get('/api/project-investors', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

        try {
            const investors = await listProjectInvestorsForProject(projectId, membership.companyId);
            return reply.send({ investors });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project investors');
            return reply.status(500).send({ error: 'Failed to load project investors.' });
        }
    });

    app.post('/api/project-investors', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const body = request.body as { investor?: any };
        const payload = body?.investor ?? body;

        const { isNonEmptyString } = await import('../validation.js');
        if (!payload?.projectId || !isNonEmptyString(payload?.name)) {
            return reply.status(400).send({ error: 'Project and investor name are required.' });
        }

        try {
            const investor = await createProjectInvestorForProject(payload.projectId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ investor });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project investor');
            if (err?.code === '42703' && String(err?.message ?? '').includes('party_id')) {
                return reply.status(500).send({
                    error: 'Investor-party linking is not available because the database schema is outdated. Please run migration 0009_project_investor_party_id.sql.',
                });
            }
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message || 'This investor is already linked to this project.' });
            }
            return reply.status(500).send({ error: 'Failed to save project investor.' });
        }
    });

    app.put('/api/project-investors/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as { investor?: any };
        const payload = body?.investor ?? body;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectInvestorRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            const investor = await updateProjectInvestorRow(id, membership.companyId, payload ?? {});
            return reply.send({ investor });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project investor');
            if (err?.code === '42703' && String(err?.message ?? '').includes('party_id')) {
                return reply.status(500).send({
                    error: 'Investor-party linking is not available because the database schema is outdated. Please run migration 0009_project_investor_party_id.sql.',
                });
            }
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message || 'This investor is already linked to this project.' });
            }
            return reply.status(500).send({ error: 'Failed to update project investor.' });
        }
    });

    app.delete('/api/project-investors/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => getProjectInvestorCompanyIdById(id),
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            await deleteProjectInvestorRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project investor');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to delete project investor.' });
        }
    });

    // ─── Investor contributions ────────────────────────────────────────────────
    app.get('/api/investor-contributions', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const investorId = (request.query as { investorId?: string }).investorId;
        if (!investorId) return reply.status(400).send({ error: 'Investor is required.' });

        try {
            const contributions = await listInvestorContributionsForInvestor(investorId, membership.companyId);
            return reply.send({ contributions });
        } catch (err: any) {
            app.log.error(err, 'Failed to list investor contributions');
            return reply.status(500).send({ error: 'Failed to load investor contributions.' });
        }
    });

    app.post('/api/investor-contributions', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const body = request.body as { contribution?: any };
        const payload = body?.contribution ?? body;
        if (!payload?.investorId) return reply.status(400).send({ error: 'Investor is required.' });

        try {
            const contribution = await createInvestorContributionForInvestor(payload.investorId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ contribution });
        } catch (err: any) {
            app.log.error(err, 'Failed to create investor contribution');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: err.message || 'Failed to save investor contribution.' });
        }
    });

    app.put('/api/investor-contributions/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as { contribution?: any };
        const payload = body?.contribution ?? body;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getInvestorContributionRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            const contribution = await updateInvestorContributionRow(id, membership.companyId, payload ?? {});
            return reply.send({ contribution });
        } catch (err: any) {
            app.log.error(err, 'Failed to update investor contribution');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to update investor contribution.' });
        }
    });

    app.delete('/api/investor-contributions/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getInvestorContributionRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            await deleteInvestorContributionRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete investor contribution');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to delete investor contribution.' });
        }
    });

    // ─── Purchase orders ───────────────────────────────────────────────────────
    app.get('/api/project-purchase-orders', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

        try {
            const companyProjectId = await getProjectCompanyId(projectId);
            if (!companyProjectId || companyProjectId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const purchaseOrders = await listPurchaseOrdersForProject(projectId, membership.companyId);
            return reply.send({ purchaseOrders });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project purchase orders');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to load purchase orders.' });
        }
    });

    app.get('/api/project-purchase-orders/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            const purchaseOrder = await getPurchaseOrderById(id, membership.companyId);
            if (!purchaseOrder) {
                return reply.status(404).send({ error: 'Purchase order not found.' });
            }

            const companyProjectId = await getProjectCompanyId(purchaseOrder.projectId);
            if (!companyProjectId || companyProjectId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            return reply.send({ purchaseOrder });
        } catch (err: any) {
            app.log.error(err, 'Failed to fetch project purchase order');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to load purchase order.' });
        }
    });

    app.post('/api/project-purchase-orders', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const body = request.body as { purchaseOrder?: any };
        const payload = body?.purchaseOrder ?? body;
        if (!payload?.projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }

        try {
            const purchaseOrder = await createPurchaseOrderForProject(payload.projectId, membership.companyId, payload);
            return reply.status(201).send({ purchaseOrder });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project purchase order');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to save purchase order.' });
        }
    });

    app.put('/api/project-purchase-orders/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as { purchaseOrder?: any };
        const payload = body?.purchaseOrder ?? body;

        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            const existing = await getPurchaseOrderById(id, membership.companyId);
            if (!existing) {
                return reply.status(404).send({ error: 'Purchase order not found.' });
            }

            const purchaseOrder = await updatePurchaseOrderForProject(id, membership.companyId, payload ?? {});
            return reply.send({ purchaseOrder });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project purchase order');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update purchase order.' });
        }
    });

    app.patch('/api/project-purchase-orders/:id/status', async (request, reply) => {
        const { id } = request.params as { id: string };
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const status = (request.body as { status?: unknown })?.status ?? (request.body as any)?.purchaseOrder?.status;
        if (!status) {
            return reply.status(400).send({ error: 'Status is required.' });
        }

        try {
            const purchaseOrder = await updatePurchaseOrderStatus(id, membership.companyId, status);
            return reply.send({ purchaseOrder });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project purchase order status');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update purchase order status.' });
        }
    });

    app.post('/api/project-purchase-orders/:id/cancel', async (request, reply) => {
        const { id } = request.params as { id: string };
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            const purchaseOrder = await cancelPurchaseOrder(id, membership.companyId);
            return reply.send({ purchaseOrder });
        } catch (err: any) {
            app.log.error(err, 'Failed to cancel project purchase order');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to cancel purchase order.' });
        }
    });

    // ─── Material receipts ─────────────────────────────────────────────────────
    app.get('/api/project-material-receipts', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

        try {
            const companyProjectId = await getProjectCompanyId(projectId);
            if (!companyProjectId || companyProjectId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const materialReceipts = await listMaterialReceiptsForProject(projectId, membership.companyId);
            return reply.send({ materialReceipts });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project material receipts');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to load material receipts.' });
        }
    });

    app.get('/api/project-material-receipts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            const materialReceipt = await getMaterialReceiptById(id, membership.companyId);
            if (!materialReceipt) {
                return reply.status(404).send({ error: 'Material receipt not found.' });
            }

            const companyProjectId = await getProjectCompanyId(materialReceipt.projectId);
            if (!companyProjectId || companyProjectId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            return reply.send({ materialReceipt });
        } catch (err: any) {
            app.log.error(err, 'Failed to fetch project material receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to load material receipt.' });
        }
    });

    app.post('/api/project-material-receipts', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const body = request.body as { materialReceipt?: any };
        const payload = body?.materialReceipt ?? body;
        if (!payload?.projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }

        try {
            const materialReceipt = await createMaterialReceiptForProject(payload.projectId, membership.companyId, payload);
            return reply.status(201).send({ materialReceipt });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project material receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to save material receipt.' });
        }
    });

    app.delete('/api/project-material-receipts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            const deleted = await deleteMaterialReceiptForProject(id, membership.companyId);
            return reply.send({ ok: deleted });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project material receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to delete material receipt.' });
        }
    });
}
