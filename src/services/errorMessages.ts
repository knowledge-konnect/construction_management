export interface ApiErrorContext {
    status?: number;
    error?: unknown;
}

const TECHNICAL_ERROR_PATTERN = /(insert failed|update failed|delete failed|sql|postgres|supabase|stack|trace|exception|jwt_secret|razorpay_key|ecconn|enotfound|econnrefused|failed \(\d+\)|pgrst|schema|relation|column|table|violates|duplicate key value|syntax error)/i;

function fallbackMessageByStatus(status?: number): string {
    if (status === 400) return 'Please check the entered information and try again.';
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return "You don't have permission to perform this action.";
    if (status === 404) return 'The requested record could not be found.';
    if (status === 409) return 'This record conflicts with existing information. Please review and try again.';
    if (status === 422) return 'Please correct the highlighted fields and try again.';
    if (status === 429) return 'Too many requests. Please wait a moment and try again.';
    if (status && status >= 500) return 'Something went wrong on our side. Please try again later.';
    return 'Something went wrong. Please try again.';
}

export function sanitizeApiErrorMessage(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const message = raw.trim();
    if (!message) return null;
    if (TECHNICAL_ERROR_PATTERN.test(message)) return null;
    return message;
}

export function toUserFacingApiError(context: ApiErrorContext): string {
    const sanitized = sanitizeApiErrorMessage(context.error);
    if (sanitized) return sanitized;
    return fallbackMessageByStatus(context.status);
}

export function networkErrorMessage(): string {
    return 'We could not connect to the server. Check your internet connection and try again.';
}

export function timeoutErrorMessage(): string {
    return 'The request took too long. Please try again.';
}
