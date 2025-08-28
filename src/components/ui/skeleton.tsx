"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted transition-colors duration-300",
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export function CardSkeleton() {
  return (
    <div className="space-y-3 p-6 bg-card rounded-lg border transition-colors duration-300">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className={cn("w-full", height)} />
    </div>
  );
}
