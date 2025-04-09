import { ApiConfiguration } from './extension'
import { AutoApprovalSettings } from './AutoApprovalSettings'
import { BrowserSettings } from './BrowserSettings'
import { ChatContent } from './ChatContent'
import { ChatSettings } from './ChatSettings'
import { OpenAiCompatibleModelInfo } from './extension'
import { WebviewMessageType } from '@/shared/WebviewMessageType'

// Utilizziamo l'enum WebviewMessageType invece di un tipo union
// export type WebviewMessageType =
//   | 'SET_STATE'
//   | 'apiConfiguration'
//   | 'telemetrySetting'
//   | 'planActSeparateModelsSetting'
//   | 'customInstructions'
//   | 'error'
//   | 'info'

// Importiamo il tipo WebviewMessage generico
export type WebviewMessage<T = any> = import('@/shared/types/webview.types').WebviewMessage<T>; 