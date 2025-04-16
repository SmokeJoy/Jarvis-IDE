import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ModelSelector } from '../ModelSelector';
import { useExtensionMessage } from '../../../hooks/useExtensionMessage';
import {
	ModelSelectorMessageUnion,
	ModelSelectorMessageType,
	ModelInfo
} from '../../../webview/messages/model-selector-message';
import { isModelSelectorMessage } from '../../../webview/messages/model-selector-message-guards';

// ... existing code ... 