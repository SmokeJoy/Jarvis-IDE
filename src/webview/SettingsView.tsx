import * as React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import {
  VSCodeTextArea,
  VSCodeTextField,
  VSCodeDropdown,
  VSCodeButton,
  VSCodeDivider,
  VSCodeOption,
  VSCodeBadge,
  VSCodeCheckbox,
} from '@vscode/webview-ui-toolkit/react';
import { useSettings } from '../webview-ui/providers/settingsProvider';
import { PromptEditor } from './components/PromptEditor';
import { SystemPromptEditor } from './components/SystemPromptEditor';

interface Model {
  id: string;
  name: string;
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  coderMode?: boolean;
}

interface Settings {
  model: string;
  coder_mode: boolean;
  use_docs: boolean;
  contextPrompt: string;
  systemPrompt: string;
  systemPromptPath?: string;
  availableModels: string[];
}

const SettingsContainer = styled.div`
  padding: 20px;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [newModel, setNewModel] = useState<Model>({
    name: '',
    id: '',
    provider: '',
    apiKey: '',
    baseUrl: '',
    coderMode: false,
  });

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ model: e.target.value });
  };

  const handleCheckboxChange =
    (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ [key]: e.target.checked });
    };

  const handlePromptChange = (key: keyof Settings) => (value: string) => {
    updateSettings({ [key]: value });
  };

  const handleNewModelChange = (key: keyof Model) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (key === 'coderMode') {
      setNewModel({ ...newModel, [key]: e.target.checked });
    } else {
      setNewModel({ ...newModel, [key]: e.target.value });
    }
  };

  const handleAddModel = () => {
    const { name, id, provider } = newModel;
    if (!name || !id || !provider) return;

    updateSettings({
      availableModels: [...settings.availableModels, id],
    });

    setNewModel({
      name: '',
      id: '',
      provider: '',
      apiKey: '',
      baseUrl: '',
      coderMode: false,
    });
  };

  return React.createElement(
    SettingsContainer,
    null,
    React.createElement(
      Section,
      null,
      React.createElement('h2', null, '🤖 Modello'),
      React.createElement(
        FormGroup,
        null,
        React.createElement(
          VSCodeDropdown,
          {
            value: settings.model,
            onChange: handleModelChange,
          },
          settings.availableModels.map((model) =>
            React.createElement(
              VSCodeOption,
              {
                key: model,
                value: model,
              },
              model
            )
          )
        )
      )
    ),

    React.createElement(
      Section,
      null,
      React.createElement('h2', null, '⚙️ Impostazioni'),
      React.createElement(
        FormGroup,
        null,
        React.createElement(
          VSCodeCheckbox,
          {
            checked: settings.coder_mode,
            onChange: handleCheckboxChange('coder_mode'),
          },
          'Modalità Coder'
        )
      ),

      React.createElement(
        FormGroup,
        null,
        React.createElement(
          VSCodeCheckbox,
          {
            checked: settings.use_docs,
            onChange: handleCheckboxChange('use_docs'),
          },
          'Usa Documentazione'
        )
      )
    ),

    React.createElement(
      Section,
      null,
      React.createElement('h2', null, '➕ Aggiungi Modello Personalizzato'),
      React.createElement(
        FormGroup,
        null,
        React.createElement(VSCodeTextField, {
          placeholder: 'Nome visibile',
          value: newModel.name,
          onChange: handleNewModelChange('name'),
        })
      ),

      React.createElement(
        FormGroup,
        null,
        React.createElement(VSCodeTextField, {
          placeholder: 'ID modello (es. deepseek-coder)',
          value: newModel.id,
          onChange: handleNewModelChange('id'),
        })
      ),

      React.createElement(
        FormGroup,
        null,
        React.createElement(VSCodeTextField, {
          placeholder: 'Provider (es. local, openai, ollama)',
          value: newModel.provider,
          onChange: handleNewModelChange('provider'),
        })
      ),

      React.createElement(
        FormGroup,
        null,
        React.createElement(
          VSCodeCheckbox,
          {
            checked: newModel.coderMode,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              setNewModel({ ...newModel, coderMode: e.target.checked });
            },
          },
          'Modalità Coder'
        )
      ),

      React.createElement(
        FormGroup,
        null,
        React.createElement(VSCodeTextField, {
          placeholder: 'API Key (opzionale)',
          value: newModel.apiKey,
          onChange: handleNewModelChange('apiKey'),
        })
      ),

      React.createElement(
        FormGroup,
        null,
        React.createElement(VSCodeTextField, {
          placeholder: 'Endpoint URL (opzionale)',
          value: newModel.baseUrl,
          onChange: handleNewModelChange('baseUrl'),
        })
      ),

      React.createElement(
        FormGroup,
        null,
        React.createElement(
          VSCodeButton,
          {
            onClick: handleAddModel,
          },
          'Aggiungi Modello'
        )
      )
    ),

    React.createElement(VSCodeDivider),

    React.createElement(
      Section,
      null,
      React.createElement('h2', null, '📝 Prompt di Sistema'),
      React.createElement(
        FormGroup,
        null,
        React.createElement(SystemPromptEditor, {
          value: settings.systemPrompt,
          onChange: handlePromptChange('systemPrompt'),
          description: "Il prompt di sistema definisce il comportamento base dell'assistente",
        })
      )
    ),

    React.createElement(VSCodeDivider),

    React.createElement(
      Section,
      null,
      React.createElement('h2', null, '🔍 Prompt di Contesto'),
      React.createElement(
        FormGroup,
        null,
        React.createElement(PromptEditor, {
          value: settings.contextPrompt,
          onChange: handlePromptChange('contextPrompt'),
          description:
            "Il prompt di contesto definisce come l'assistente deve utilizzare il contesto del codice",
        })
      )
    )
  );
};
