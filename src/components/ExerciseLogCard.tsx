import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ExerciseRecommendation } from '../engine/recommendations';
import { categoryColour, COLOURS, FONT, RADIUS, SPACING } from '../theme';

interface Props {
  rec: ExerciseRecommendation;
  onLog: (exercise: string, variant: string, sets: number) => void;
  initialVariant?: string;
  initialSets?: number;
}

export function ExerciseLogCard({ rec, onLog, initialVariant, initialSets }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(initialVariant ?? rec.variants[0] ?? '');
  const [sets, setSets] = useState(initialSets ?? 3);

  const colour = categoryColour(rec.movementCategory);

  const handleLog = () => {
    if (!selectedVariant) return;
    onLog(rec.exercise, selectedVariant, sets);
    setExpanded(false);
  };

  return (
    <View style={[styles.card, { borderLeftColor: colour }]}>
      {/* Row header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{rec.exercise}</Text>
          <Text style={styles.targetText}>
            {rec.targets.join(', ')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.catPill, { backgroundColor: colour + '22', borderColor: colour }]}>
            <Text style={[styles.catPillText, { color: colour }]}>
              {rec.movementCategory}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: COLOURS.textSecondary }]}>
            {expanded ? '▲' : '▼'}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Variant chip row */}
          <Text style={styles.fieldLabel}>VARIATION</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            {rec.variants.map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setSelectedVariant(v)}
                style={[
                  styles.chip,
                  selectedVariant === v
                    ? { backgroundColor: colour, borderColor: colour }
                    : { borderColor: COLOURS.border },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedVariant === v ? '#000' : COLOURS.textSecondary },
                  ]}
                >
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sets stepper */}
          <Text style={styles.fieldLabel}>SETS</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setSets((s) => Math.max(1, s - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.setsValue}>{sets}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setSets((s) => Math.min(10, s + 1))}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Log button */}
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: colour }]}
            onPress={handleLog}
            activeOpacity={0.8}
          >
            <Text style={styles.logBtnText}>Log {sets} sets of {selectedVariant}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLOURS.surfaceHigh,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  targetText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    textTransform: 'capitalize',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  catPill: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  catPillText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: FONT.xs,
  },
  body: {
    padding: SPACING.md,
    paddingTop: 0,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLOURS.border,
  },
  fieldLabel: {
    color: COLOURS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: SPACING.sm,
  },
  chipScroll: {
    marginTop: SPACING.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingRight: SPACING.md,
  },
  chip: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  chipText: {
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLOURS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '700',
    lineHeight: FONT.xl + 4,
  },
  setsValue: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '900',
    minWidth: 48,
    textAlign: 'center',
  },
  logBtn: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  logBtnText: {
    color: '#000',
    fontSize: FONT.md,
    fontWeight: '800',
  },
});
