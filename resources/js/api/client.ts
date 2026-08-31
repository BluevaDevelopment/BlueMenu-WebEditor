/**
 * Thin fetch wrapper for the editor API.
 *
 * Every call goes through the session cookie the validation endpoint sets, so
 * there is no token to carry around beyond the CSRF header Laravel expects.
 */

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
        this.name = 'ApiError';
    }

    /** The plugin did not answer, so the editor should offer to retry rather than fail hard. */
    get isServerOffline(): boolean {
        return this.status === 503;
    }
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken(),
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            (payload as { message?: string } | null)?.message ?? `Request failed with status ${response.status}`;

        throw new ApiError(message, response.status);
    }

    return payload as T;
}

export const api = {
    get: <T>(url: string): Promise<T> => request<T>('GET', url),
    post: <T>(url: string, body?: unknown): Promise<T> => request<T>('POST', url, body ?? {}),
    delete: <T>(url: string, body?: unknown): Promise<T> => request<T>('DELETE', url, body ?? {}),
};
