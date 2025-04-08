export interface ModelInfo {
    name: string
    description: string
    context_length: number
    pricing?: {
        prompt: number
        completion: number
    }
}

export interface ModelDescriptionProps {
    markdown: string
    isExpanded: boolean
    setIsExpanded: (isExpanded: boolean) => void
    isPopup?: boolean
}

export interface ModelFeatureProps {
    icon: string
    label: string
    isSupported: boolean
    supportsLabel: string
}

export interface ModelItemProps {
    id: string
    html: string
    isSelected: boolean
    onClick: () => void
}

export type ModelId = string 