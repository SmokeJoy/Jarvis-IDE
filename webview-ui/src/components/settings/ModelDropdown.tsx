import React from 'react'
import styled from 'styled-components'

interface ModelDropdownProps {
  isVisible: boolean
  items: Array<{
    name: string
    description: string
  }>
  selectedIndex: number
  onSelect: (index: number) => void
  itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  dropdownRef: React.RefObject<HTMLDivElement>
}

const ModelList = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--vscode-dropdown-background);
  border: 1px solid var(--vscode-dropdown-border);
  border-radius: 2px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  display: ${props => props.isVisible ? 'block' : 'none'};
`

const ModelItem = styled.div<{ isSelected: boolean }>`
  padding: 8px;
  cursor: pointer;
  background: ${props => props.isSelected ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent'};
  color: ${props => props.isSelected ? 'var(--vscode-list-activeSelectionForeground)' : 'inherit'};

  &:hover {
    background: var(--vscode-list-hoverBackground);
  }

  strong {
    display: block;
    margin-bottom: 4px;
  }

  small {
    opacity: 0.8;
  }
`

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  isVisible,
  items,
  selectedIndex,
  onSelect,
  itemRefs,
  dropdownRef,
}) => {
  return (
    <ModelList ref={dropdownRef} isVisible={isVisible}>
      {items.map((item, index) => (
        <ModelItem
          key={item.name}
          ref={el => {
            if (itemRefs.current) {
              itemRefs.current[index] = el
            }
          }}
          isSelected={index === selectedIndex}
          onClick={() => onSelect(index)}
        >
          <strong>{item.name}</strong>
          {item.description && <small>{item.description}</small>}
        </ModelItem>
      ))}
    </ModelList>
  )
} 