import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    return (
      <div className={cn("relative flex w-full touch-none items-center select-none", className)}>
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onValueChange([parseFloat(e.target.value)])}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
