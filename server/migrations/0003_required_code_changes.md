# Required App Code Changes (Separated From SQL)

This file documents application changes required to fully use the new schema.
No runtime code changes are applied yet.

## 1) Direct project creation workflow

### Backend
- File: `server/src/index.ts`
- Route: `POST /api/projects`
- Current behavior blocks direct creation when `source_document_id` is missing.
- Required change:
  - Allow direct project creation for `owner` and `admin` roles.
  - Keep quotation conversion validation only when `source_document_id` is provided.

### Frontend
- File: `src/services/project.service.ts`
- Current behavior returns early when `sourceDocumentId` is missing.
- Required change:
  - Allow payload without `sourceDocumentId` for direct creation.

## 2) Master ID mappings (backward-compatible with snapshots)

### Documents / quotations
- Files: `server/src/index.ts`, `src/services/document.service.ts`, quotation UI components
- Add optional request/read mappings for:
  - `project_type_id`
  - `area_unit_id`
  - `tax_rate_id`
- Keep existing snapshot text fields:
  - `project_type`, `area_unit`, `tax_name`, `tax_percentage`, `tax_amount`

### Document items
- Files: quotation BOQ UI/service
- Add optional `unit_id` mapping while preserving `unit` text snapshot.

### Projects
- Files: `server/src/projects.ts`, `src/services/project.service.ts`
- Add optional:
  - `project_type_id`
  - `project_type_snapshot`

### Project expenses
- Files: `server/src/projects.ts`, `src/services/projectCost.service.ts`
- Add optional `category_id` while preserving `category` snapshot.

### Receipts and expense payments
- Files: `server/src/projects.ts`, `src/services/projectCost.service.ts`
- Add optional `payment_method_id` while preserving `payment_method` snapshot.

## 3) Workflow confirmations after code update

- Direct create should succeed without quotation.
- Conversion route should require Accepted quotation.
- Duplicate conversion must fail due to unique index on `(company_id, source_document_id)` where source document is not null.
