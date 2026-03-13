import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MovementCategory, MOVEMENT_CATEGORY_META, MuscleGroup } from '../data/exercises';
import { MusclePriority } from '../engine/priority';
import { ExerciseRecommendation } from '../engine/recommendations';
import { categoryColour, COLOURS, FONT, RADIUS, SPACING } from '../theme';
import { ExerciseLogCard } from './ExerciseLogCard';

interface Props {
  catKey: Exclude<MovementCategory, 'accessory'>;
  exercises: ExerciseRecommendation[];
  priorities: MusclePriority[];
  weekTarget: number;
  onLog: (exercise: string, variant: string, sets: number) => void;
}

export function CategoryCard({ catKey, exercises, priorities, weekTarget, onLog }: Props) {
  const [expanded, setExpanded] = useState(false);
  const meta = MOVEMENT_CATEGORY_META[catKey];
  if (!meta) return null;

  const colour = categoryColour(catKey);
  const relevantMuscles = [...meta.primaryMuscles, ...meta.accessoryMuscles];
  const muscleProgress = priorities.filter((p) => relevantMuscles.includes(p.muscle));
  const minPct = muscleProgress.length
    ? Math.min(...muscleProgress.map((p) => p.percentage))
    : 0;

  const topScore = exercises.length > 0 ? exercises[0].score.toFixed(1) : '0';

  const borderColour: string =
    minPct >= 100 ? COLOURS.ringDone
    : minPct >= 75 ? '#84CC16'
    : minPct >= 50 ? COLOURS.gradeC
    : COLOURS.danger;

  return (
    <View style={[styles.card, { borderColor: borderColour }]}>
      {/* Header */}
      <TouchableOpacity
        style={[styles.header, { backgroundColor: colour + '22' }]}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: colour }]} />
          <View>
            <Text style={styles.catLabel}>{meta.label}</Text>
            <Text style={styles.catSub}>{meta.subtitle}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.scorePill, { borderColor: colour }]}>
            <Text style={[styles.scoreText, { color: colour }]}>{topScore}</Text>
          </View>
          <Text style={[styles.pctText, { color: minPct >= 100 ? COLOURS.ringDone : COLOURS.textSecondary }]}>
            {Math.round(minPct)}%
          </Text>
          <Text style={[styles.chevron, { color: colour }]}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Muscle progress bars */}
          <View style={styles.muscleSection}>
            {muscleProgress.map((p) => (
              <View key={p.muscle} style={styles.muscleRow}>
                <View style={styles.muscleLabelRow}>
                  <Text style={styles.muscleName}>
                    {p.muscle}{!p.isPrimary ? ' (acc)' : ''}
                  </Text>
                  <Text style={[styles.muscleVol, { color: p.current >= weekTarget ? COLOURS.ringDone : COLOURS.textSecondary }]}>
                    {p.current.toFixed(1)}/{weekTarget}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(p.percentage, 100)}%` as any,
                        backgroundColor: p.isPrimary
                          ? p.percentage >= 100 ? COLOURS.ringDone
                          : p.percentage >= 60 ? COLOURS.gradeC
                          : COLOURS.danger
                          : COLOURS.pull,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Exercise cards */}
          <View style={styles.exerciseSection}>
            <Text style={styles.sectionLabel}>RECOMMENDED</Text>
            {exercises.slice(0, 4).map((rec) => (
              <ExerciseLogCard key={rec.exercise} rec={rec} onLog={onLog} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    backgroundColor: COLOURS.surface,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catLabel: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  catSub: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scorePill: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: FONT.xs,
    fontWeight: '700',
  },
  pctText: {
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  chevron: {
    fontSize: FONT.xs,
    fontWeight: '700',
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: COLOURS.border,
  },
  muscleSection: {
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLOURS.surfaceHigh,
  },
  muscleRow: {
    gap: 4,
  },
  muscleLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muscleName: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  muscleVol: {
    fontSize: FONT.xs,
    fontWeight: '600',
  },
  track: {
    height: 6,
    backgroundColor: COLOURS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  exerciseSection: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionLabel: {
    color: COLOURS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
});
