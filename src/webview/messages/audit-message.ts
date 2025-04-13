import { WebviewMessage } from './webview-message';

export enum AuditMessageType {
  REQUEST_AUDIT = 'requestAudit',
  AUDIT_UPDATED = 'auditUpdated',
  ERROR = 'error',
}

export interface AuditMessage<T extends AuditMessageType> extends WebviewMessage<T> {
  payload: T extends AuditMessageType.REQUEST_AUDIT
    ? void
    : T extends AuditMessageType.AUDIT_UPDATED
      ? {
          audit: Array<{
            id: string;
            timestamp: number;
            type: string;
            provider: string;
            success: boolean;
            error?: string;
            duration: number;
            metadata?: Record<string, unknown>;
          }>;
        }
      : T extends AuditMessageType.ERROR
        ? {
            error: string;
          }
        : never;
}

export type AuditMessageUnion = {
  [K in AuditMessageType]: AuditMessage<K>;
}[AuditMessageType];

export function createAuditMessage<T extends AuditMessageType>(
  type: T,
  payload: AuditMessage<T>['payload']
): AuditMessage<T> {
  return { type, payload } as AuditMessage<T>;
}
