import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useWorkoutStore } from '../src/store/workoutStore';
import { COLOURS, FONT, RADIUS, SPACING, categoryColour, gradeAccent } from '../src/theme';
import { NudgeCard } from '../src/components/NudgeCard';
import { ConfettiBurst } from '../src/components/ConfettiBurst';
import { exerciseLibrary } from '../src/data/exercises';
import { FinishWeekPayload } from '../src/engine/finishWeek';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────────────────────────
// Self-contained FinishWeekCard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FinishWeekCard — self-contained.
 *
 * Receives the initial payload from the store once (via useRef snapshot).
 * Tracks which muscles have been logged in local state. The card stays open
 * until every suggestion is logged OR the user explicitly dismisses it.
 * The store's finishWeekPayload is only used to decide whether to mount the
 * card — once mounted it is fully independent of store re-renders.
 */
function FinishWeekCard({
  payload,
  accentColour,
  onLog,
  onDismiss,
}: {
  payload: FinishWeekPayload;
  accentColour: string;
  onLog: (exercise: string, variant: string, sets: number) => void;
  onDismiss: () => void;
}) {
  // Snapshot suggestions at mount time — never re-read from store
  const initialSuggestions = useRef(payload.suggestions).current;
  const [loggedMuscles, setLoggedMuscles] = useState<Set<string>>(new Set());
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const remaining = initialSuggestions.filter((s) => !loggedMuscles.has(s.muscle));
  const allLogged = remaining.length === 0;

  const handleLog = (muscle: string, exercise: string, variant: string, sets: number) => {
    onLog(exercise, variant, sets);
    setLoggedMuscles((prev) => new Set([...prev, muscle]));
  };

  if (allLogged) {
    setTimeout(onDismiss, 800);
    return (
      <View style={[fwStyles.card, { borderColor: accentColour }]}>
        <View style={fwStyles.allDoneRow}>
          <Text style={fwStyles.allDoneText}>Week finished! 🏁</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[fwStyles.card, { borderColor: accentColour }]}>
      {/* Header */}
      <View style={fwStyles.header}>
        <Text style={fwStyles.icon}>🏁</Text>
        <View style={fwStyles.headerText}>
          <Text style={fwStyles.title}>Finish the Week</Text>
          <Text style={fwStyles.subtitle}>
            {remaining.length} muscle group{remaining.length !== 1 ? 's' : ''} still to go
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={fwStyles.dismissBtn}>
          <Text style={fwStyles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* All suggestions — logged ones greyed with checkmark */}
      {initialSuggestions.map((s) => {
        const isLogged = loggedMuscles.has(s.muscle);

        return (
          <View
            key={s.muscle}
            style={[fwStyles.suggestion, isLogged && fwStyles.suggestionDone]}
          >
            <View style={fwStyles.suggestionHeader}>
              <Text style={[fwStyles.muscleName, isLogged && fwStyles.muscleNameDone]}>
                {isLogged ? '✓ ' : ''}{s.muscle.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
              {!isLogged && (
                <Text style={fwStyles.remaining}>
                  {s.remaining.toFixed(1)} sets
                </Text>
              )}
            </View>

            {!isLogged && (
              <View style={fwStyles.btnRow}>
                {s.exercises.slice(0, 2).map((ex) => {
                  const key = `${s.muscle}-${ex.exercise}`;
                  const variant = selectedVariants[key] ?? ex.variants[0];
                  return (
                    <TouchableOpacity
                      key={ex.exercise}
                      style={[fwStyles.logBtn, { borderColor: accentColour }]}
                      onPress={() =>
                        handleLog(s.muscle, ex.exercise, variant, Math.ceil(s.remaining))
                      }
                    >
                      <Text style={[fwStyles.logBtnName, { color: accentColour }]}>
                        {ex.exercise}
                      </Text>
                      <Text style={fwStyles.logBtnSets}>
                        {Math.ceil(s.remaining)} sets
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity style={fwStyles.skipBtn} onPress={onDismiss}>
        <Text style={fwStyles.skipText}>Skip — I'm done for today</Text>
      </TouchableOpacity>
    </View>
  );
}

const fwStyles = StyleSheet.create({
  card: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLOURS.surfaceHigh,
  },
  icon: { fontSize: 22 },
  headerText: { flex: 1 },
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
  suggestionDone: { opacity: 0.4 },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muscleName: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  muscleNameDone: {
    color: COLOURS.ringDone,
    textDecorationLine: 'line-through',
  },
  remaining: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  logBtn: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  logBtnName: {
    fontSize: FONT.sm,
    fontWeight: '800',
  },
  logBtnSets: {
    color: COLOURS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '600',
    marginTop: 2,
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

// ─────────────────────────────────────────────────────────────────────────────
// Active Session Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function ActiveSessionScreen() {
  const router = useRouter();
  const {
    activeSession,
    sessionProgress,
    nudgeSuggestions,
    finishWeekPayload,
    getWeekGrade,
    logWorkout,
    logQuickFinisher,
    dismissNudge,
    dismissFinishWeek,
    clearSession,
  } = useWorkoutStore();

  const grade = getWeekGrade();
  const accentColour = gradeAccent(grade.grade);

  const [localSets, setLocalSets] = useState<Record<string, number>>({});
  const [localVariants, setLocalVariants] = useState<Record<string, string>>({});
  const [confetti, setConfetti] = useState<{ visible: boolean; intensity: 'small' | 'large' }>(
    { visible: false, intensity: 'small' },
  );

  const triggerCelebration = useCallback((intensity: 'small' | 'large') => {
    if (intensity === 'large') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setConfetti({ visible: true, intensity });
  }, []);

  if (!activeSession) {
    return <Redirect href="/(tabs)" />;
  }

  const getSets = (ex: string, def: number) => localSets[ex] ?? def;
  const getVariant = (ex: string, def: string) => localVariants[ex] ?? def;

  const prescribedCompletedCount = activeSession.exercises.filter(
    (ex) => !!sessionProgress[ex.exercise],
  ).length;
  const completedCount = Object.values(sessionProgress).filter(Boolean).length;
  const totalCount = activeSession.exercises.length;
  const allDone = prescribedCompletedCount >= totalCount || completedCount >= totalCount;

  const handleLog = (exercise: string, variant: string, sets: number) => {
    logWorkout(exercise, variant, sets);
    // Determine if this log completes the session
    const willComplete =
      activeSession &&
      activeSession.exercises
        .filter((e) => e.exercise !== exercise)
        .every((e) => !!sessionProgress[e.exercise]);
    triggerCelebration(willComplete ? 'large' : 'small');
  };

  const handleEndSession = () => {
    if (!allDone) {
      Alert.alert(
        'End Session?',
        `You've completed ${completedCount}/${totalCount} exercises. End the session anyway?`,
        [
          { text: 'Keep Going', style: 'cancel' },
          {
            text: 'End Session',
            onPress: () => {
              clearSession();
              router.replace('/(tabs)');
            },
          },
        ],
      );
    } else {
      clearSession();
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Confetti overlay — sits above everything, pointer-events none */}
      <ConfettiBurst
        visible={confetti.visible}
        intensity={confetti.intensity}
        onDone={() => setConfetti((c) => ({ ...c, visible: false }))}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.sessionTitle}>{activeSession.label}</Text>
            <Text style={styles.progressText}>
              {completedCount}/{totalCount} exercises
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.endBtn, allDone && { backgroundColor: accentColour }]}
            onPress={handleEndSession}
          >
            <Text style={[styles.endBtnText, allDone && { color: '#000' }]}>
              {allDone ? 'Done!' : 'End'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, (completedCount / totalCount) * 100)}%` as any,
                backgroundColor: accentColour,
              },
            ]}
          />
        </View>

        {/* Nudge card — self-contained, only mounts when suggestions arrive */}
        {nudgeSuggestions.length > 0 && (
          <NudgeCard
            suggestions={nudgeSuggestions}
            onLog={logQuickFinisher}
            onDismiss={dismissNudge}
          />
        )}

        {/* Finish week card — self-contained, only mounts at session completion */}
        {finishWeekPayload?.shouldShow && (
          <FinishWeekCard
            payload={finishWeekPayload}
            accentColour={accentColour}
            onLog={logQuickFinisher}
            onDismiss={dismissFinishWeek}
          />
        )}

        {/* Exercise cards */}
        <View style={styles.exerciseList}>
          {activeSession.exercises.map((ex, idx) => {
            const done = !!sessionProgress[ex.exercise];
            const colour = categoryColour(ex.movementCategory);
            const sets = getSets(ex.exercise, ex.sets);
            const variant = getVariant(ex.exercise, ex.variant);
            const allVariants = exerciseLibrary[ex.exercise]?.variants ?? [variant];

            return (
              <View
                key={ex.exercise}
                style={[
                  styles.exCard,
                  { borderLeftColor: done ? COLOURS.ringDone : colour },
                  done && styles.exCardDone,
                ]}
              >
                {/* Header */}
                <View style={styles.exHeader}>
                  <View style={styles.exHeaderLeft}>
                    <View
                      style={[
                        styles.exNumber,
                        { backgroundColor: done ? COLOURS.ringDone + '33' : colour + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.exNumberText,
                          { color: done ? COLOURS.ringDone : colour },
                        ]}
                      >
                        {done ? '✓' : idx + 1}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.exName, done && styles.exNameDone]}>
                        {ex.exercise}
                      </Text>
                      <Text style={styles.exTargets}>
                        {ex.targets.map((t) => t.replace(/([A-Z])/g, ' $1').trim()).join(' · ')}
                      </Text>
                    </View>
                  </View>
                </View>

                {!done && (
                  <>
                    {/* Variant chips */}
                    {allVariants.length > 1 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipRow}
                      >
                        {allVariants.map((v) => (
                          <TouchableOpacity
                            key={v}
                            onPress={() =>
                              setLocalVariants((prev) => ({ ...prev, [ex.exercise]: v }))
                            }
                            style={[
                              styles.chip,
                              variant === v
                                ? { backgroundColor: colour, borderColor: colour }
                                : { borderColor: COLOURS.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: variant === v ? '#000' : COLOURS.textSecondary },
                              ]}
                            >
                              {v}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {/* Set dots + stepper */}
                    <View style={styles.setsSection}>
                      <View style={styles.setDots}>
                        {Array.from({ length: sets }).map((_, i) => (
                          <View
                            key={i}
                            style={[styles.dot, { backgroundColor: colour }]}
                          />
                        ))}
                      </View>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() =>
                            setLocalSets((prev) => ({
                              ...prev,
                              [ex.exercise]: Math.max(1, (prev[ex.exercise] ?? ex.sets) - 1),
                            }))
                          }
                        >
                          <Text style={styles.stepBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.setsValue}>{sets}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() =>
                            setLocalSets((prev) => ({
                              ...prev,
                              [ex.exercise]: Math.min(10, (prev[ex.exercise] ?? ex.sets) + 1),
                            }))
                          }
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Log button */}
                    <TouchableOpacity
                      style={[styles.logBtn, { backgroundColor: colour }]}
                      onPress={() => handleLog(ex.exercise, variant, sets)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.logBtnText}>
                        Log {sets} sets · {variant}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.base },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingTop: SPACING.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  headerLeft: { gap: 2 },
  sessionTitle: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '900',
  },
  progressText: { color: COLOURS.textSecondary, fontSize: FONT.sm },
  endBtn: {
    backgroundColor: COLOURS.surfaceHigh,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  endBtnText: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: COLOURS.border,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  exerciseList: { gap: SPACING.md },
  exCard: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  exCardDone: { opacity: 0.6 },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    flex: 1,
  },
  exNumber: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumberText: { fontSize: FONT.md, fontWeight: '900' },
  exName: { color: COLOURS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  exNameDone: { textDecorationLine: 'line-through', color: COLOURS.textSecondary },
  exTargets: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    textTransform: 'capitalize',
    marginTop: 2,
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
  chipText: { fontSize: FONT.sm, fontWeight: '600' },
  setsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  setDots: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLOURS.surfaceHigh,
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
    minWidth: 40,
    textAlign: 'center',
  },
  logBtn: {
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
