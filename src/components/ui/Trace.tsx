'use client';

import React from 'react';

interface TraceProps {
  /** Data for the planned line (array of y values) */
  plannedData?: number[];
  /** Data for the actual line (array of y values) */
  actualData?: number[];
  /** Data for the ember line (array of y values, graphics only) */
  emberData?: number[];
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** Whether to show the planned line */
  showPlanned?: boolean;
  /** Whether to show the actual line */
  showActual?: boolean;
  /** Whether to show the ember line */
  showEmber?: boolean;
  /** Additional class names for the SVG container */
  className?: string;
}

/**
 * Trace component following Bearing design system
 * Visualizes planned, actual, and corrected (ember) plans
 */
export default function Trace({
  plannedData,
  actualData,
  emberData,
  width = 200,
  height = 100,
  showPlanned = true,
  showActual = true,
  showEmber = false,
  className = '',
}: TraceProps) {
  // Combine all data to calculate min and max for scaling
  const allValues: number[] = [
    ...(plannedData || []),
    ...(actualData || []),
    ...(emberData || []),
  ];

  if (allValues.length === 0) {
    return null; // No data to show
  }

  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const rangeY = maxY - minY;
  const scaleY = rangeY === 0 ? 1 : height / rangeY;

  // Determine the maximum length among the three datasets
  const lengths = [
    plannedData?.length || 0,
    actualData?.length || 0,
    emberData?.length || 0,
  ].filter(Boolean);
  const maxLength = Math.max(...lengths);
  const scaleX = maxLength <= 1 ? 0 : width / (maxLength - 1);

  // Helper to convert data array to points
  const getPoints = (data: number[] | undefined) => {
    if (!data) return [];
    return data.map((value, index) => {
      const x = index * scaleX;
      const y = height - ((value - minY) * scaleY);
      return { x, y };
    });
  };

  const plannedPoints = getPoints(plannedData);
  const actualPoints = getPoints(actualData);
  const emberPoints = getPoints(emberData);

  // Helper to create SVG path string from points
  const getPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points
      .map((point, index) => {
        const { x, y } = point;
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  const plannedPath = getPath(plannedPoints);
  const actualPath = getPath(actualPoints);
  const emberPath = getPath(emberPoints);

  // Base classes for the SVG container
  const baseClasses = 'block';

  // Combine classes
  const classes = `${baseClasses} ${className}`.trim();

  return (
    <div className={classes} role="img" aria-label="Trace visualization showing planned, actual, and corrected plan">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {/* Planned line: dashed, cool blue */}
        {showPlanned && plannedPath && (
          <path
            d={plannedPath}
            fill="none"
            stroke="var(--plan)"
            strokeWidth="2"
            strokeDasharray="4,2"
          />
        )}
        {/* Actual line: solid ink */}
        {showActual && actualPath && (
          <path
            d={actualPath}
            fill="none"
            stroke="var(--actual)"
            strokeWidth="2"
            strokeDasharray="0"
          />
        )}
        {/* Ember line: solid, graphics only (now/corrected plan) */}
        {showEmber && emberPath && (
          <path
            d={emberPath}
            fill="none"
            stroke="var(--ember)"
            strokeWidth="2"
            strokeDasharray="0"
          />
        )}
      </svg>
    </div>
  );
}