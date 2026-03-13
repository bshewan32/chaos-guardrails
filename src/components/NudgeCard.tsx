import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NudgeSuggestion } from '../engine/nudge';
import { COLOURS, FONT, RADIUS, SPACING } from '../theme';

interface Props {
  suggestions: NudgeSuggestion[];
  onLog: (exercise: string, variant: string, sets: number) => void;
  onDismiss: () => void;
}

export function NudgeCard({ suggestions, onLog, onDismiss }: Props) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>🎯</Text>
          <View>
            <Text style={styles.title}>Almost There!</Text>
            <Text style={styles.subtitle}>You're close to finishing a muscle group</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>

      {suggestions.map((s) => {
        const selectedVariant = selectedVariants[s.muscle] ?? s.exercises[0]?.variants[0] ?? '';
        const firstEx = s.exercises[0];

        return (
          <View key={s.muscle} style={styles.suggestion}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.muscleName}>{s.muscle}</Text>
              <Text style={styles.remaining}>
                {s.remaining <= 1 ? '🔥' : '⚡'} {s.remaining.toFixed(1)} sets away
              </Text>
            </View>

            {s.exercises.slice(0, 2).map((ex) => (
              <View key={ex.exercise} style={styles.exRow}>
                <Text style={styles.exName}>{ex.exercise}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {ex.variants.slice(0, 4).map((v) => {
                    const key = `${s.muscle}-${ex.exercise}`;
                    const isSelected = (selectedVariants[key] ?? ex.variants[0]) === v;
                    return (
                      <TouchableOpacity
                        key={v}
                        onPress={() =>
                          setSelectedVariants((prev) => ({ ...prev, [key]: v }))
                        }
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                        ]}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {v}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={styles.logBtn}
                  onPress={() => {
                    const key = `${s.muscle}-${ex.exercise}`;
                    const variant = selectedVariants[key] ?? ex.variants[0];
                    const setsNeeded = Math.ceil(s.remaining);
                    onLog(ex.exercise, variant, setsNeeded);
                  }}
                >
                  <Text style={styles.logBtnText}>
                    Log {Math.ceil(s.remaining)} sets
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLOURS.gradeC,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLOURS.gradeC + '22',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '800',
  },
  subtitle: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
  },
  dismissBtn: {
    padding: SPACING.xs,
  },
  dismissText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.lg,
    fontWeight: '700',
  },
  suggestion: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLOURS.border,
    gap: SPACING.sm,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muscleName: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  remaining: {
    color: COLOURS.gradeC,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  exRow: {
    gap: SPACING.xs,
  },
  exName: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLOURS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  chipSelected: {
    backgroundColor: COLOURS.gradeC,
    borderColor: COLOURS.gradeC,
  },
  chipText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#000',
  },
  logBtn: {
    backgroundColor: COLOURS.gradeC,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  logBtnText: {
    color: '#000',
    fontSize: FONT.sm,
    fontWeight: '800',
  },
});
