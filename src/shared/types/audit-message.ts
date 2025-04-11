import { BaseMessage } from './message.js';

export enum AuditMessageType {
  REQUEST_AUDIT = 'requestAudit',
  AUDIT_UPDATED = 'auditUpdated',
  ERROR = 'error'
}

export interface AuditMessage<T extends AuditMessageType> extends BaseMessage<T> {
  payload: T extends AuditMessageType.REQUEST_AUDIT ? void :
    T extends AuditMessageType.AUDIT_UPDATED ? {
      records: Array<{
        id: string;
        timestamp: number;
        type: string;
        provider: string;
        success: boolean;
        error?: string;
        duration: number;
        metadata?: Record<string, unknown>;
      }>;
      lastUpdated: number;
    } :
    T extends AuditMessageType.ERROR ? {
      error: string;
    } :
    never;
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