/**
 * @file AutoApprovalSettings.ts
 * @description Tipi e funzioni per le impostazioni di approvazione automatica
 */

import type { AutoApprovalSettings as BaseAutoApprovalSettings } from './types/user-settings.types.js.js';

/**
 * Estensione dell'interfaccia AutoApprovalSettings per retrocompatibilità
 */
export interface AutoApprovalSettings extends Omit<BaseAutoApprovalSettings, 'actions'> {
  maxAutoApprovals: number;
  allowReadOnly: boolean;
  allowReadWrite: boolean;
  allowTerminalCommands: boolean;
  actions: {
    readFiles: boolean;
    editFiles: boolean;
    executeCommands: boolean;
    useBrowser: boolean;
    useMcp: boolean;
  };
  maxRequests: number;
  enableNotifications: boolean;
  tools: string[];
}

/**
 * Normalizza le impostazioni di approvazione automatica
 * @param settings Le impostazioni da normalizzare
 * @returns Le impostazioni normalizzate
 */
export function normalizeAutoApprovalSettings(settings?: Partial<AutoApprovalSettings>): AutoApprovalSettings {
  return {
    enabled: settings?.enabled ?? false,
    maxAutoApprovals: settings?.maxAutoApprovals ?? 3,
    allowReadOnly: settings?.allowReadOnly ?? true,
    allowReadWrite: settings?.allowReadWrite ?? false,
    allowTerminalCommands: settings?.allowTerminalCommands ?? false,
    actions: {
      readFiles: settings?.actions?.readFiles ?? false,
      editFiles: settings?.actions?.editFiles ?? false,
      executeCommands: settings?.actions?.executeCommands ?? false,
      useBrowser: settings?.actions?.useBrowser ?? false,
      useMcp: settings?.actions?.useMcp ?? false
    },
    maxRequests: settings?.maxRequests ?? 5,
    enableNotifications: settings?.enableNotifications ?? true,
    tools: settings?.tools ?? []
  };
}
