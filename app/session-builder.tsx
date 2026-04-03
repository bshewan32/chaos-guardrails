import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '../src/store/workoutStore';
import { COLOURS, FONT, RADIUS, SPACING, categoryColour, gradeAccent } from '../src/theme';
import { exerciseLibrary } from '../src/data/exercises';

export default function SessionBuilderScreen() {
  const router = useRouter();
  const {
    activeSession,
    buildNewSession,
    startSession,
    getWeekGrade,
  } = useWorkoutStore();

  const grade = getWeekGrade();
  const accentColour = gradeAccent(grade.grade);

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No session built yet</Text>
          <TouchableOpacity
            style={[styles.buildBtn, { backgroundColor: accentColour }]}
            onPress={buildNewSession}
          >
            <Text style={styles.buildBtnText}>Build Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleStart = () => {
    startSession();
    router.push('/active-session');
  };

  const handleShuffle = () => {
    buildNewSession();
  };

  const axialNote = activeSession.axialNote;
  const overreachNote = activeSession.overreachNote;
  const isOverreach = activeSession.mode === 'overreach' || activeSession.mode === 'complete';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.sessionLabel}>{activeSession.label}</Text>
            <Text style={styles.sessionCount}>
              {activeSession.exercises.length} exercises
            </Text>
          </View>
          <TouchableOpacity onPress={handleShuffle} style={styles.shuffleBtn}>
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        {/* Overreach / complete week banner */}
        {isOverreach && overreachNote && (
          <View style={[styles.noteBanner, styles.overreachBanner]}>
            <Text style={styles.noteIcon}>
              {activeSession.mode === 'complete' ? '🏆' : '⚡'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.overreachTitle}>
                {activeSession.mode === 'complete' ? 'Week Complete' : 'Almost There'}
              </Text>
              <Text style={styles.noteText}>{overreachNote}</Text>
            </View>
          </View>
        )}

        {/* Axial note */}
        {axialNote && !isOverreach && (
          <View style={styles.noteBanner}>
            <Text style={styles.noteIcon}>🛡</Text>
            <Text style={styles.noteText}>{axialNote}</Text>
          </View>
        )}

        {/* Exercise cards */}
        <View style={styles.exerciseList}>
          {activeSession.exercises.map((ex, idx) => {
            const colour = categoryColour(ex.movementCategory);
            const axialCost = exerciseLibrary[ex.exercise]?.axialCost ?? 'low';
            const variantCount = exerciseLibrary[ex.exercise]?.variants?.length ?? 1;

            return (
              <View key={ex.exercise} style={[styles.exCard, { borderLeftColor: colour }]}>
                {/* Exercise header */}
                <View style={styles.exHeader}>
                  <View style={styles.exHeaderLeft}>
                    <View style={styles.exNumberBadge}>
                      <Text style={[styles.exNumber, { color: colour }]}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exName}>{ex.exercise}</Text>
                      <Text style={styles.exTargets}>
                        {ex.targets.map((t) => t.replace(/([A-Z])/g, ' $1').trim()).join(' · ')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pillRow}>
                    {axialCost !== 'low' && (
                      <View style={[
                        styles.axialPill,
                        { backgroundColor: axialCost === 'high' ? COLOURS.danger + '33' : COLOURS.gradeC + '33' },
                      ]}>
                        <Text style={[
                          styles.axialPillText,
                          { color: axialCost === 'high' ? COLOURS.danger : COLOURS.gradeC },
                        ]}>
                          {axialCost} load
                        </Text>
                      </View>
                    )}
                    {variantCount > 1 && (
                      <View style={styles.variantPill}>
                        <Text style={styles.variantPillText}>{ex.variant}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Hint row */}
        <View style={styles.hintRow}>
          <Text style={styles.hintIcon}>↕</Text>
          <Text style={styles.hintText}>
            You can swap variations and adjust sets for each exercise once the session starts.
          </Text>
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: accentColour }]}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Start Session</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.base },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingTop: SPACING.lg },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  emptyTitle: {
    color: COLOURS.textSecondary,
    fontSize: FONT.lg,
    fontWeight: '700',
  },
  buildBtn: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  buildBtnText: {
    color: '#000',
    fontSize: FONT.md,
    fontWeight: '800',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backBtn: { padding: SPACING.xs },
  backText: { color: COLOURS.textSecondary, fontSize: FONT.md, fontWeight: '600' },
  headerCenter: { alignItems: 'center', flex: 1 },
  sessionLabel: {
    color: COLOURS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '900',
  },
  sessionCount: { color: COLOURS.textSecondary, fontSize: FONT.sm },
  shuffleBtn: {
    backgroundColor: COLOURS.surfaceHigh,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  shuffleText: { color: COLOURS.textPrimary, fontSize: FONT.sm, fontWeight: '700' },

  noteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  noteIcon: { fontSize: 18 },
  noteText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  overreachBanner: {
    borderWidth: 1,
    borderColor: COLOURS.gradeA + '55',
    backgroundColor: COLOURS.gradeA + '12',
    alignItems: 'flex-start',
  },
  overreachTitle: {
    color: COLOURS.gradeA,
    fontSize: FONT.md,
    fontWeight: '800',
    marginBottom: 2,
  },

  exerciseList: { gap: SPACING.md, marginBottom: SPACING.md },
  exCard: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    padding: SPACING.md,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  exHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    flex: 1,
  },
  exNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLOURS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumber: { fontSize: FONT.sm, fontWeight: '900' },
  exName: { color: COLOURS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  exTargets: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  axialPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  axialPillText: { fontSize: FONT.xs, fontWeight: '700' },
  variantPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLOURS.surfaceHigh,
  },
  variantPillText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: '600',
  },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  hintIcon: {
    color: COLOURS.textMuted,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  hintText: {
    flex: 1,
    color: COLOURS.textMuted,
    fontSize: FONT.sm,
    fontStyle: 'italic',
    lineHeight: FONT.sm * 1.5,
  },

  startBtn: {
    borderRadius: RADIUS.full,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#000',
    fontSize: FONT.lg,
    fontWeight: '900',
  },
});
