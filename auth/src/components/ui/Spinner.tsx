import { Loader2 } from "lucide-react";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <Loader2
      className={["animate-spin", sizeMap[size], className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
