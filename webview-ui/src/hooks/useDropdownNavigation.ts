import { useCallback, useRef, useState } from 'react'

export interface UseDropdownNavigationProps {
  itemsLength: number
  onSelect: (index: number) => void
  isVisible?: boolean
  onClose?: () => void
}

export const useDropdownNavigation = ({
  itemsLength,
  onSelect,
  isVisible = false,
  onClose,
}: UseDropdownNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isVisible) {
        return
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => {
            const next = prev + 1
            return next >= itemsLength ? 0 : next
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => {
            const next = prev - 1
            return next < 0 ? itemsLength - 1 : next
          })
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0) {
            onSelect(selectedIndex)
            onClose?.()
          }
          break
        case 'Escape':
          event.preventDefault()
          onClose?.()
          break
      }

      if (selectedIndex >= 0 && itemRefs.current?.[selectedIndex]) {
        itemRefs.current[selectedIndex]?.scrollIntoView({
          block: 'nearest',
        })
      }
    },
    [isVisible, itemsLength, onSelect, onClose, selectedIndex]
  )

  return {
    selectedIndex,
    handleKeyDown,
    itemRefs,
    dropdownRef,
  }
} 