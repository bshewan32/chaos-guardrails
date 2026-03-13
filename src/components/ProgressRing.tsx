import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLOURS, ringColour, FONT } from '../theme';

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  muscle: string;
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest',
  lats: 'Lats',
  upperBack: 'Back',
  quads: 'Quads',
  glutes: 'Glutes',
  hamstrings: 'Hams',
};

export function ProgressRing({ percentage, size = 72, strokeWidth = 6, muscle }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;
  const colour = ringColour(clampedPct);
  const label = MUSCLE_LABELS[muscle] ?? muscle;
  const done = clampedPct >= 100;

  return (
    <View style={[styles.container, { width: size, height: size + 18 }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLOURS.ringEmpty}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colour}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Centre text */}
      <View style={[styles.centre, { width: size, height: size }]}>
        <Text style={[styles.pct, { color: done ? COLOURS.ringDone : COLOURS.textPrimary }]}>
          {done ? '✓' : `${Math.round(clampedPct)}%`}
        </Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centre: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pct: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  label: {
    marginTop: 4,
    fontSize: FONT.xs,
    color: COLOURS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
