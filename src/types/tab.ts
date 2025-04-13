export type TabId = string;

export interface TabBadge {
  type: 'info' | 'warning' | 'error' | 'success';
  count: number;
}

export interface TabItem {
  id: TabId;
  label: string;
  badge?: TabBadge;
  isDisabled?: boolean;
  icon?: string;
}
