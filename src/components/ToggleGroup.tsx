'use client'

import { useId } from 'react'

interface ToggleOption<T extends string> {
  value: T
  label: string
}

interface ToggleGroupProps<T extends string> {
  options: ReadonlyArray<ToggleOption<T>>
  value: T | ''
  onChange: (value: T) => void
  name: string
  disabled?: boolean
  'aria-label'?: string
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  name,
  disabled = false,
  'aria-label': ariaLabel,
}: ToggleGroupProps<T>) {
  const groupId = useId()

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="w-full grid grid-cols-3 gap-0 rounded-lg bg-gray-800 p-1 focus-within:outline-none"
    >
      {options.map((option) => {
        const id = `${groupId}-${option.value}`
        const isSelected = value === option.value

        return (
          <div key={option.value} className="relative">
            <input
              type="radio"
              id={id}
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="sr-only"
            />
            <label
              htmlFor={id}
              className={`
                flex items-center justify-center w-full px-4 py-3
                text-sm font-medium rounded-lg cursor-pointer select-none
                transition-all duration-200 ease-in-out outline-none
                focus:outline-none active:outline-none
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }
              `}
            >
              {option.label}
            </label>
          </div>
        )
      })}
    </div>
  )
} 