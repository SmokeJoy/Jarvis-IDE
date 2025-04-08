import React, { useCallback } from "react"
import { VSCodeSlider } from "../common/VSCodeSlider"
import { ApiConfiguration } from "../../../../src/shared/types/api.types"
import './ThinkingBudgetSlider.css'

export interface ThinkingBudgetSliderProps {
	apiConfiguration: ApiConfiguration
	setApiConfiguration: (config: ApiConfiguration) => void
}

export const ThinkingBudgetSlider: React.FC<ThinkingBudgetSliderProps> = ({
	apiConfiguration,
	setApiConfiguration
}) => {
	const handleChange = useCallback((e: Event) => {
		const target = e.target as HTMLInputElement
		setApiConfiguration({
			...apiConfiguration,
			thinkingBudget: parseFloat(target.value),
		})
	}, [apiConfiguration, setApiConfiguration])

	return (
		<div className="thinking-budget-slider">
			<VSCodeSlider
				value={apiConfiguration.thinkingBudget || 0}
				onChange={handleChange}
				min={0}
				max={100}
				step={1}
			/>
			<span>{apiConfiguration.thinkingBudget || 0}%</span>
		</div>
	)
}
