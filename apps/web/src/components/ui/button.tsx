import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "spotify";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold ring-offset-background transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#1DB954] text-black hover:bg-[#1ed760]": variant === "spotify",
            "bg-white text-black hover:bg-gray-100": variant === "default",
            "border border-[#878787] bg-transparent hover:border-white text-white": variant === "outline",
            "hover:bg-[#2a2a2a] text-white": variant === "ghost",
            "text-white underline-offset-4 hover:underline": variant === "link",
            "h-12 px-8 py-3": size === "default",
            "h-9 px-3": size === "sm",
            "h-14 px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
