import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { NudgeSuggestion } from '../engine/nudge';
import { COLOURS, FONT, RADIUS, SPACING } from '../theme';

interface Props {
  suggestions: NudgeSuggestion[];
  onLog: (exercise: string, variant: string, sets: number) => void;
  onDismiss: () => void;
}

/**
 * NudgeCard — self-contained.
 *
 * The card receives its initial suggestions from the store once. After that it
 * manages its own "logged" state in local React state. This means logging one
 * muscle group never causes the card to disappear — it simply marks that row
 * as done and keeps the remaining rows visible. The card only closes when:
 *   (a) every suggestion has been logged, or
 *   (b) the user taps ✕ / "Skip"
 *
 * The store's nudgeSuggestions array is only used to determine whether to
 * mount the card in the first place (non-empty = show). Once mounted, the
 * card is independent.
 */
export function NudgeCard({ suggestions, onLog, onDismiss }: Props) {
  // Track which muscles have been logged in this card instance
  const [loggedMuscles, setLoggedMuscles] = useState<Set<string>>(new Set());
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Snapshot the initial suggestions so they don't change if the store updates
  const initialSuggestions = useRef(suggestions).current;

  if (initialSuggestions.length === 0) return null;

  const remaining = initialSuggestions.filter((s) => !loggedMuscles.has(s.muscle));
  const allLogged = remaining.length === 0;

  const handleLog = (muscle: string, exercise: string, variant: string, sets: number) => {
    onLog(exercise, variant, sets);
    setLoggedMuscles((prev) => new Set([...prev, muscle]));
  };

  // Auto-dismiss once everything is logged
  if (allLogged) {
    // Small delay so the user sees the last item tick off before the card vanishes
    setTimeout(onDismiss, 800);
    return (
      <View style={styles.card}>
        <View style={styles.allDoneRow}>
          <Text style={styles.allDoneText}>All done! Great work. 🎯</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>🎯</Text>
          <View>
            <Text style={styles.title}>Almost There!</Text>
            <Text style={styles.subtitle}>
              {remaining.length} muscle group{remaining.length !== 1 ? 's' : ''} within reach
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Show all suggestions — logged ones appear greyed out with a checkmark */}
      {initialSuggestions.map((s) => {
        const isLogged = loggedMuscles.has(s.muscle);

        return (
          <View
            key={s.muscle}
            style={[styles.suggestion, isLogged && styles.suggestionDone]}
          >
            <View style={styles.suggestionHeader}>
              <Text style={[styles.muscleName, isLogged && styles.muscleNameDone]}>
                {isLogged ? '✓ ' : ''}{s.muscle.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
              {!isLogged && (
                <Text style={styles.remaining}>
                  {s.remaining <= 1 ? '🔥' : '⚡'} {s.remaining.toFixed(1)} sets away
                </Text>
              )}
            </View>

            {!isLogged && s.exercises.slice(0, 2).map((ex) => {
              const key = `${s.muscle}-${ex.exercise}`;
              const selectedVariant = selectedVariants[key] ?? ex.variants[0];

              return (
                <View key={ex.exercise} style={styles.exRow}>
                  <Text style={styles.exName}>{ex.exercise}</Text>
                  {ex.variants.length > 1 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipRow}
                    >
                      {ex.variants.slice(0, 5).map((v) => {
                        const isSelected = selectedVariant === v;
                        return (
                          <TouchableOpacity
                            key={v}
                            onPress={() =>
                              setSelectedVariants((prev) => ({ ...prev, [key]: v }))
                            }
                            style={[styles.chip, isSelected && styles.chipSelected]}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                              {v}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                  <TouchableOpacity
                    style={styles.logBtn}
                    onPress={() =>
                      handleLog(s.muscle, ex.exercise, selectedVariant, Math.ceil(s.remaining))
                    }
                  >
                    <Text style={styles.logBtnText}>
                      Log {Math.ceil(s.remaining)} sets
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        );
      })}

      <TouchableOpacity style={styles.skipBtn} onPress={onDismiss}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
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
  icon: { fontSize: 24 },
  title: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '800',
  },
  subtitle: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
  },
  dismissBtn: { padding: SPACING.xs },
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
  suggestionDone: {
    opacity: 0.45,
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
  muscleNameDone: {
    color: COLOURS.ringDone,
    textDecorationLine: 'line-through',
  },
  remaining: {
    color: COLOURS.gradeC,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  exRow: { gap: SPACING.xs },
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
  chipTextSelected: { color: '#000' },
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
  skipBtn: {
    borderTopWidth: 1,
    borderTopColor: COLOURS.border,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  skipText: {
    color: COLOURS.textMuted,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  allDoneRow: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  allDoneText: {
    color: COLOURS.ringDone,
    fontSize: FONT.md,
    fontWeight: '800',
  },
});
