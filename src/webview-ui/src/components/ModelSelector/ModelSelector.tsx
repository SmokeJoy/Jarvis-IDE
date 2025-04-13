import { useExtensionMessage } from '../../hooks/useExtensionMessage';
import { ModelSelectorMessageUnion } from '../../../webview/messages/model-selector-message';
import {
  isModelListUpdatedMessage,
  isModelSelectedMessage,
  isRequestModelsMessage,
} from '../../../webview/messages/model-selector-message-guards';

export const ModelSelector = () => {
  const { postMessage } = useExtensionMessage<ModelSelectorMessageUnion>();

  const handleModelSelect = (modelId: string) => {
    postMessage({
      type: 'modelSelected',
      payload: { modelId },
    });
  };

  const refreshModels = () => {
    postMessage({ type: 'requestModels' });
  };

  // Gestione messaggi in arrivo dall'estensione
  useMessageHandler({
    [ModelSelectorMessageType.MODEL_LIST_UPDATED]: (payload) => {
      // Aggiornamento stato locale
    },
  });

  return <div className="model-selector-container">{/* UI per selezione modello */}</div>;
};
