import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { StockHealthSegment } from '@/types/inventory';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

export interface DonutChartProps {
  segments: Array<{ value: number; color: string; label?: string }>;
  size?: number;
  strokeWidth?: number;
  centerNumber?: string | number;
  centerLabel?: string;
}

export function DonutChart({
  segments,
  size = 84,
  strokeWidth = 8,
  centerNumber,
  centerLabel,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.neutral.borderLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((seg, i) => {
          const strokeDasharray = `${(seg.value / total) * circumference * 0.96} ${circumference}`;
          const strokeDashoffset = -accumulatedAngle;
          accumulatedAngle += (seg.value / total) * circumference;

          return (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </Svg>

      {(centerNumber != null || centerLabel != null) && (
        <View style={styles.centerOverlay} pointerEvents="none">
          {centerNumber != null && (
            <Text style={styles.centerNumber}>{centerNumber}</Text>
          )}
          {centerLabel != null && (
            <Text style={styles.centerLabel}>{centerLabel}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = Colors.brand.primary,
  width = 280,
  height = 42,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padY = 4;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - padY - ((v - min) / range) * (height - padY * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#sparklineGrad)" />
      <Path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={color} />
    </Svg>
  );
}

export interface StockBarProps {
  segments: StockHealthSegment[];
  height?: number;
}

export function StockBar({ segments, height = 8 }: StockBarProps) {
  const total = segments.reduce((s, h) => s + h.pct, 0) || 1;

  return (
    <View style={[styles.stockBarContainer, { height, borderRadius: height / 2 }]}>
      {segments.map((s) => (
        <View
          key={s.label}
          style={{
            width: `${(s.pct / total) * 100}%`,
            backgroundColor: s.bg,
            height: '100%',
          }}
        />
      ))}
    </View>
  );
}

export interface LineChartProps {
  physical: number[];
  theoretical: number[];
  labels: string[];
  width?: number;
  height?: number;
}

export function LineChart({
  physical,
  theoretical,
  labels,
  width = 300,
  height = 120,
}: LineChartProps) {
  if (!physical || !Array.isArray(physical) || physical.length < 2) return null;

  const phys = physical.map((v) => Number(v) || 0);
  const theo = Array.isArray(theoretical) ? theoretical.map((v) => Number(v) || 0) : [];
  const all = [...phys, ...theo];
  if (all.length === 0) return null;
  const min = Math.min(...all) - 2;
  const max = Math.max(...all) + 2;
  const range = max - min || 1;

  const pL = 28;
  const pR = 8;
  const pT = 10;
  const pB = 22;

  const toX = (i: number) => pL + (i / (physical.length - 1)) * (width - pL - pR);
  const toY = (v: number) => pT + (1 - (v - min) / range) * (height - pT - pB);

  const physLine = physical.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const physArea = `${physLine} L${(width - pR).toFixed(1)},${height - pB} L${pL},${height - pB} Z`;

  const theoLine = theoretical.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  const gridYs = [0.25, 0.5, 0.75, 1].map((t) => min + range * t);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="physLineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={Colors.brand.primary} stopOpacity="0.15" />
          <Stop offset="100%" stopColor={Colors.brand.primary} stopOpacity="0.0" />
        </LinearGradient>
      </Defs>

      {/* Horizontal gridlines */}
      {gridYs.map((v, i) => (
        <G key={i}>
          <Line
            x1={pL}
            y1={toY(v)}
            x2={width - pR}
            y2={toY(v)}
            stroke={Colors.neutral.borderLight}
            strokeWidth={1}
          />
          <SvgText
            x={pL - 4}
            y={toY(v) + 3}
            textAnchor="end"
            fontSize="9"
            fill={Colors.neutral.textTertiary}
          >
            {v.toFixed(0)}
          </SvgText>
        </G>
      ))}

      {/* X Labels */}
      {labels.map((lbl, idx) => {
        if (labels.length > 5 && idx % 2 !== 0) return null;
        return (
          <SvgText
            key={idx}
            x={toX(idx)}
            y={height - 4}
            textAnchor="middle"
            fontSize="9"
            fill={Colors.neutral.textTertiary}
          >
            {lbl.slice(0, 6)}
          </SvgText>
        );
      })}

      {/* Theoretical Dashed Line */}
      <Path
        d={theoLine}
        fill="none"
        stroke={Colors.neutral.textTertiary}
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* Physical Area & Solid Line */}
      <Path d={physArea} fill="url(#physLineGrad)" />
      <Path
        d={physLine}
        fill="none"
        stroke={Colors.brand.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Physical Dots */}
      {physical.map((v, i) => (
        <Circle
          key={i}
          cx={toX(i)}
          cy={toY(v)}
          r={2.5}
          fill={Colors.brand.primary}
        />
      ))}
    </Svg>
  );
}

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartItem[];
  width?: number;
  height?: number;
  formatValue?: (val: number) => string;
}

export function BarChart({
  data,
  width = 300,
  height = 140,
  formatValue,
}: BarChartProps) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const pL = 10;
  const pR = 10;
  const pT = 20;
  const pB = 25;

  const chartW = width - pL - pR;
  const chartH = height - pT - pB;

  const barWidth = Math.max(12, Math.min(32, (chartW / data.length) * 0.55));
  const slotW = chartW / data.length;

  return (
    <Svg width={width} height={height}>
      {data.map((item, idx) => {
        const barH = (item.value / maxVal) * chartH;
        const x = pL + idx * slotW + (slotW - barWidth) / 2;
        const y = pT + chartH - barH;
        const barColor = item.color || Colors.brand.primary;

        return (
          <G key={idx}>
            {/* Background bar slot */}
            <Rect
              x={x}
              y={pT}
              width={barWidth}
              height={chartH}
              rx={barWidth / 2}
              fill={Colors.neutral.surface}
            />

            {/* Filled bar */}
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={Math.min(4, barWidth / 2)}
              fill={barColor}
            />

            {/* Value Label */}
            <SvgText
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill={Colors.neutral.textSecondary}
            >
              {formatValue ? formatValue(item.value) : item.value.toString()}
            </SvgText>

            {/* X Axis Label */}
            <SvgText
              x={x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              fontSize="9"
              fill={Colors.neutral.textTertiary}
            >
              {item.label.slice(0, 5)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.neutral.textPrimary,
    lineHeight: 20,
  },
  centerLabel: {
    ...Typography.micro,
    fontSize: 9,
    color: Colors.neutral.textTertiary,
    textTransform: 'uppercase',
  },
  stockBarContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 2,
    backgroundColor: Colors.neutral.borderLight,
    width: '100%',
  },
});
