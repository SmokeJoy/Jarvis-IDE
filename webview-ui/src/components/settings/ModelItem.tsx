import React from 'react'
import { ModelItemContainer } from './OpenRouterModelPicker.styles'
import { ModelItemProps } from '../../types/model'

export const ModelItem = React.forwardRef<HTMLDivElement, ModelItemProps>(({
    id: _id, // Ignoriamo l'id poiché non lo utilizziamo nel render
    html,
    isSelected,
    onClick
}, ref) => {
    return (
        <ModelItemContainer
            ref={ref}
            role="option"
            aria-selected={isSelected}
            onClick={onClick}
            $isSelected={isSelected}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}) 