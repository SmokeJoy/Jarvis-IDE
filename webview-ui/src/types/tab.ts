export interface TabItem {
    id: string
    label: string
    badge?: {
        count: number
        type?: 'info' | 'warning' | 'error'
    }
    disabled?: boolean
    tooltip?: string
}

export type TabId = string 