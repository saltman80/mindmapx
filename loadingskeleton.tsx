import React from 'react'

interface LoadingSkeletonProps {
  count?: number
}

export default function LoadingSkeleton({ count = 6 }: LoadingSkeletonProps): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
    >
      <span className="sr-only">Loading...</span>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-item-${index}`}
          className="flex flex-col space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          <div aria-hidden="true" className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div aria-hidden="true" className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div aria-hidden="true" className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div aria-hidden="true" className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}