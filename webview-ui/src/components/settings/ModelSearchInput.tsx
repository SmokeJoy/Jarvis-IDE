import React, { KeyboardEvent } from 'react'
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { SearchInput, ClearButton } from './OpenRouterModelPicker.styles'

interface ModelSearchInputProps {
    value: string
    onChange: (value: string) => void
    onFocus: () => void
    onBlur: (e: React.FocusEvent) => void
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
    placeholder?: string
}

export const ModelSearchInput: React.FC<ModelSearchInputProps> = ({
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    placeholder = "Cerca e seleziona un modello..."
}) => {
    return (
        <SearchInput>
            <VSCodeTextField
                id="model-search"
                placeholder={placeholder}
                value={value}
                onInput={(e) => onChange((e.target as HTMLInputElement)?.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                style={{ width: "100%" }}>
                {value && (
                    <ClearButton
                        className="codicon codicon-close"
                        aria-label="Pulisci ricerca"
                        onClick={() => onChange("")}
                        slot="end"
                    />
                )}
            </VSCodeTextField>
        </SearchInput>
    )
} 