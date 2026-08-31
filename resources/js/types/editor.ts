export type Platform = 'java' | 'bedrock';

export interface SessionValidation {
    valid: boolean;
    sessionId: string;
    confirmed: boolean;
    message: string;
    confirmedBy: string | null;
    verificationMatch: boolean;
    serverVersion: string | null;
}

export interface VerificationToken {
    success: boolean;
    verificationId: string | null;
    message: string;
}

/** Every answer the plugin returns travels inside this envelope. */
export interface RpcEnvelope<T> {
    ok: boolean;
    payload: T;
    error: string | null;
}

/** One menu as the plugin reports it when it scans the menus directory. */
export interface MenuDescriptor {
    fileName: string;
    menuName: string;
    platform: string;
    type: string;
    openCommand: string;
    itemCount: number;
    /** False when the file sits in the folder but is not listed in settings.yml, so the plugin never loads it. */
    registered: boolean;
    /** Where the content lives: a menu synced from MySQL is not edited on disk. */
    source: 'disk' | 'mysql';
}

export interface MenuContent {
    platform: string;
    fileName: string;
    content: string;
}

export interface MaintenanceStatus {
    enabled: boolean;
    scheduledAt: number | null;
}

export type SessionPhase =
    | 'registering'
    | 'awaiting-confirmation'
    | 'validating'
    | 'ready'
    | 'consumed'
    | 'unreachable';

export interface SessionState {
    phase: SessionPhase;
    verificationId: string | null;
    serverVersion: string | null;
    message: string;
}
