import React, { useState } from 'react';
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
import { exerciseLibrary } from '../src/data/exercises';

export default function ActiveSessionScreen() {
  const router = useRouter();
  const {
    activeSession,
    sessionProgress,
    nudgeSuggestions,
    finishWeekPayload,
    weekTarget,
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
                width: `${(completedCount / totalCount) * 100}%` as any,
                backgroundColor: accentColour,
              },
            ]}
          />
        </View>

        {/* Nudge card */}
        {nudgeSuggestions.length > 0 && (
          <NudgeCard
            suggestions={nudgeSuggestions}
            onLog={logQuickFinisher}
            onDismiss={dismissNudge}
          />
        )}

        {/* Finish week card */}
        {finishWeekPayload?.shouldShow && (
          <View style={[styles.finishWeekCard, { borderColor: accentColour }]}>
            <View style={styles.finishWeekHeader}>
              <Text style={styles.finishWeekIcon}>🏁</Text>
              <View style={styles.finishWeekHeaderText}>
                <Text style={styles.finishWeekTitle}>Finish the Week?</Text>
                <Text style={styles.finishWeekSub}>
                  {finishWeekPayload.incompleteMuscles} muscle
                  {finishWeekPayload.incompleteMuscles !== 1 ? 's' : ''} within{' '}
                  {finishWeekPayload.totalSetsNeeded.toFixed(1)} sets of target
                </Text>
              </View>
              <TouchableOpacity onPress={dismissFinishWeek} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>✕</Text>
              </TouchableOpacity>
            </View>
            {finishWeekPayload.suggestions.map((s) => (
              <View key={s.muscle} style={styles.finishSuggestion}>
                <Text style={styles.finishMuscle}>{s.muscle}</Text>
                <Text style={styles.finishRemaining}>
                  {s.remaining.toFixed(1)} sets needed
                </Text>
                {s.exercises.slice(0, 1).map((ex) => (
                  <TouchableOpacity
                    key={ex.exercise}
                    style={[styles.finishLogBtn, { backgroundColor: accentColour }]}
                    onPress={() => logQuickFinisher(ex.exercise, ex.variants[0], Math.ceil(s.remaining))}
                  >
                    <Text style={styles.finishLogBtnText}>
                      {ex.exercise} — {Math.ceil(s.remaining)} sets
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
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
                      <Text style={styles.exTargets}>{ex.targets.join(', ')}</Text>
                    </View>
                  </View>
                </View>

                {!done && (
                  <>
                    {/* Variant chips */}
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
  finishWeekCard: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  finishWeekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  finishWeekIcon: { fontSize: 24 },
  finishWeekHeaderText: { flex: 1 },
  finishWeekTitle: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '800',
  },
  finishWeekSub: { color: COLOURS.textSecondary, fontSize: FONT.sm },
  dismissBtn: { padding: SPACING.xs },
  dismissText: { color: COLOURS.textSecondary, fontSize: FONT.lg },
  finishSuggestion: {
    borderTopWidth: 1,
    borderTopColor: COLOURS.border,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  finishMuscle: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  finishRemaining: { color: COLOURS.textSecondary, fontSize: FONT.sm },
  finishLogBtn: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  finishLogBtnText: { color: '#000', fontSize: FONT.sm, fontWeight: '800' },
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
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLOURS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: COLOURS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '700',
    lineHeight: FONT.lg + 4,
  },
  setsValue: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '900',
    minWidth: 32,
    textAlign: 'center',
  },
  logBtn: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  logBtnText: { color: '#000', fontSize: FONT.md, fontWeight: '800' },
});
