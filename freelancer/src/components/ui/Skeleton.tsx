import React from "react";

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
}) => {
  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={`bg-raised rounded-md animate-pulse ${className}`}
    />
  );
};

