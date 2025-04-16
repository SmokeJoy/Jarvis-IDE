import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VSCodeTextArea, VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useExtensionState } from '../../context/ExtensionStateContext';
import { PromptHistoryEntry } from '@shared/types/prompt-history.types';
import { isPromptHistoryResponse, isPromptResponseError } from '@shared/types/prompt-history-message-guards';
import { useExtensionMessageHandler } from '@/hooks/useExtensionMessageHandler'; // Assuming this hook exists
import { WebviewMessage } from '@/types/messages'; // Assuming this type exists 