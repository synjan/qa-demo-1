"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface EnhancedSliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  showTicks?: boolean
  tickCount?: number
  trackHeight?: 'sm' | 'md' | 'lg'
  thumbSize?: 'sm' | 'md' | 'lg'
}

function EnhancedSlider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showTicks = false,
  tickCount = 5,
  trackHeight = 'md',
  thumbSize = 'md',
  ...props
}: EnhancedSliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  const trackHeightClasses = {
    sm: 'data-[orientation=horizontal]:h-2',
    md: 'data-[orientation=horizontal]:h-3',
    lg: 'data-[orientation=horizontal]:h-4'
  }

  const thumbSizeClasses = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8'
  }

  const generateTicks = () => {
    if (!showTicks) return null
    
    const ticks = []
    // const step = (max - min) / (tickCount - 1) // Currently unused but may be needed for labeled ticks
    
    for (let i = 0; i < tickCount; i++) {
      const position = (i / (tickCount - 1)) * 100
      ticks.push(
        <div
          key={i}
          className="absolute w-0.5 h-3 bg-gray-400 dark:bg-gray-500 -translate-x-0.5 rounded-full"
          style={{ left: `${position}%`, bottom: '-10px' }}
        />
      )
    }
    
    return <div className="absolute inset-x-0 top-full">{ticks}</div>
  }

  return (
    <div className="relative">
      <SliderPrimitive.Root
        data-slot="enhanced-slider"
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        className={cn(
          "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col py-4",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="enhanced-slider-track"
          className={cn(
            "bg-gray-200 dark:bg-gray-700 relative grow overflow-hidden rounded-full shadow-inner border border-gray-300 dark:border-gray-600",
            trackHeightClasses[trackHeight],
            "data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
          )}
        >
          <SliderPrimitive.Range
            data-slot="enhanced-slider-range"
            className={cn(
              "bg-gradient-to-r from-blue-500 to-blue-600 absolute rounded-full shadow-sm border border-blue-400",
              "data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
            )}
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="enhanced-slider-thumb"
            key={index}
            className={cn(
              "border-3 border-blue-500 bg-white dark:bg-gray-50 shadow-lg block shrink-0 rounded-full transition-all duration-200 cursor-grab active:cursor-grabbing",
              "hover:border-blue-600 hover:shadow-xl hover:scale-110 hover:bg-blue-50",
              "focus-visible:border-blue-600 focus-visible:shadow-xl focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2",
              "active:scale-95 active:shadow-md active:border-blue-700",
              "disabled:pointer-events-none disabled:opacity-50",
              thumbSizeClasses[thumbSize]
            )}
          >
            {/* Inner dot for better visibility */}
            <div className="absolute inset-0 m-auto w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
          </SliderPrimitive.Thumb>
        ))}
        {generateTicks()}
      </SliderPrimitive.Root>
    </div>
  )
}

export { EnhancedSlider }