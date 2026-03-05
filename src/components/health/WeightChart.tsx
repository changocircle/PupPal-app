/**
 * Weight Chart — PRD-05 §6
 *
 * Simple line chart using basic RN views (no chart lib dependency).
 * Plots weight entries over time with age on x-axis.
 */

import React, { useMemo } from "react";
import { View, Dimensions } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { Typography } from "@/components/ui";
import type { WeightEntry, WeightUnit } from "@/types/health";
import { COLORS } from "@/constants/theme";

interface WeightChartProps {
  entries: WeightEntry[];
  unit: WeightUnit;
  height?: number;
}

export function WeightChart({
  entries,
  unit,
  height = 200,
}: WeightChartProps) {
  const width = Dimensions.get("window").width - 72; // account for padding

  const chartData = useMemo(() => {
    if (entries.length === 0) return null;

    const points = entries.map((e) => ({
      x: e.ageAtMeasurementWeeks,
      y: unit === "kg" ? e.weightKg : e.weightValue,
    }));

    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = 0;
    const maxY = Math.max(...points.map((p) => p.y)) * 1.15;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const padding = { top: 20, bottom: 30, left: 40, right: 16 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const scaledPoints = points.map((p) => ({
      sx: padding.left + ((p.x - minX) / rangeX) * chartW,
      sy: padding.top + chartH - ((p.y - minY) / rangeY) * chartH,
      raw: p,
    }));

    // Build SVG path
    let pathD = "";
    scaledPoints.forEach((p, i) => {
      pathD += i === 0 ? `M ${p.sx} ${p.sy}` : ` L ${p.sx} ${p.sy}`;
    });

    // Y-axis labels (4 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = minY + (rangeY / 4) * i;
      const sy = padding.top + chartH - ((val - minY) / rangeY) * chartH;
      return { val: Math.round(val * 10) / 10, sy };
    });

    // X-axis labels
    const xTicks = scaledPoints.filter(
      (_, i) => i === 0 || i === scaledPoints.length - 1 || i % Math.max(1, Math.floor(scaledPoints.length / 4)) === 0
    );

    return { scaledPoints, pathD, yTicks, xTicks, padding, chartH };
  }, [entries, unit, width, height]);

  if (!chartData || entries.length === 0) {
    return (
      <View
        className="items-center justify-center bg-surface rounded-xl"
        style={{ height }}
      >
        <Typography className="text-[32px] mb-sm">⚖️</Typography>
        <Typography variant="body-sm" color="secondary">
          No weight entries yet
        </Typography>
        <Typography variant="caption" color="tertiary">
          Add your first weigh-in to start tracking
        </Typography>
      </View>
    );
  }

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {chartData.yTicks.map((tick, i) => (
          <React.Fragment key={`y-${i}`}>
            <Line
              x1={chartData.padding.left}
              y1={tick.sy}
              x2={width - chartData.padding.right}
              y2={tick.sy}
              stroke="#F0EBE6"
              strokeWidth={1}
            />
            <SvgText
              x={chartData.padding.left - 8}
              y={tick.sy + 4}
              textAnchor="end"
              fontSize={10}
              fill="#9CA3AF"
            >
              {tick.val}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X-axis labels */}
        {chartData.xTicks.map((pt, i) => (
          <SvgText
            key={`x-${i}`}
            x={pt.sx}
            y={height - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#9CA3AF"
          >
            {`Wk ${pt.raw.x}`}
          </SvgText>
        ))}

        {/* Line */}
        <Path
          d={chartData.pathD}
          stroke={COLORS.primary.DEFAULT}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.scaledPoints.map((pt, i) => (
          <Circle
            key={i}
            cx={pt.sx}
            cy={pt.sy}
            r={4}
            fill={COLORS.primary.DEFAULT}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Unit label */}
      <Typography
        variant="caption"
        color="tertiary"
        className="text-center mt-xs"
      >
        Weight ({unit}) by age in weeks
      </Typography>
    </View>
  );
}
