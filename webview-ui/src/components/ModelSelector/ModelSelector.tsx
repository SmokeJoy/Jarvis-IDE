import React, { useState, useEffect, useCallback } from 'react';
// import { ModelSelectorMessageUnion, ModelSelectorMessageType } from '../webview/messages/model-selector-message'; // Commentato
// import {
//     isModelListUpdatedMessage,
//     isModelLoadErrorMessage,
//     isModelSelectedMessage,
// } from '../webview/messages/model-selector-message-guards'; // Commentato
import { useExtensionState } from '@/context/ExtensionStateContext';
// import { useMessageHandler } from '@/hooks/useMessageHandler'; // Commentato
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import type { ModelInfo } from '@/types/ModelInfo'; // Commentato se problematico

// ... existing code ... 