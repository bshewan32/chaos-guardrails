import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeekGrade } from '../engine/grades';
import { COLOURS, FONT, RADIUS, SPACING } from '../theme';

interface Props {
  grade: WeekGrade;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeBadge({ grade, size = 'md' }: Props) {
  const dim = size === 'lg' ? 72 : size === 'md' ? 56 : 40;
  const fontSize = size === 'lg' ? 32 : size === 'md' ? 24 : 18;
  const labelSize = size === 'lg' ? FONT.sm : FONT.xs;

  return (
    <View
      style={[
        styles.badge,
        {
          width: dim,
          height: dim + 20,
          borderColor: grade.accentColour,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize, color: grade.accentColour }]}>
        {grade.grade}
      </Text>
      <Text style={[styles.label, { fontSize: labelSize, color: grade.accentColour }]}>
        {grade.label}
      </Text>
      <Text style={[styles.pct, { color: COLOURS.textSecondary }]}>
        {Math.round(grade.avgPercentage)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    backgroundColor: COLOURS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  letter: {
    fontWeight: '900',
    lineHeight: undefined,
  },
  label: {
    fontWeight: '700',
    marginTop: 1,
  },
  pct: {
    fontSize: FONT.xs,
    fontWeight: '600',
    marginTop: 1,
  },
});
