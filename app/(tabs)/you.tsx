import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { COLOURS, FONT, RADIUS, SPACING } from '../../src/theme';

const SET_TARGET_OPTIONS = [
  {
    value: 5,
    label: '5 sets',
    description: 'Maintenance — minimum effective stimulus per muscle per week',
  },
  {
    value: 10,
    label: '10 sets',
    description: 'Balanced — solid weekly volume for consistent progress',
  },
  {
    value: 15,
    label: '15 sets',
    description: 'High volume — maximum adaptive stimulus per week',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How does the session builder work?',
    a: 'The builder scores every exercise based on which muscles need the most work this week. It then applies guardrails — limiting heavy spinal loading, capping posterior chain work, and injecting category diversity — before shuffling the final order to keep sessions unpredictable.',
  },
  {
    q: 'What is the nudge?',
    a: 'If you log a set that brings any muscle within 2 sets of its weekly target, the app suggests a quick finisher to complete that group. It fires at most once per session.',
  },
  {
    q: 'What is the Finish Week card?',
    a: 'At the end of a completed session, if every primary muscle is within 2 sets of its target, the app shows a summary of what it would take to close out the week.',
  },
  {
    q: 'Why does the app sometimes allow two heavy spinal exercises?',
    a: 'The axial load budget has a built-in 15% random override. This is intentional — occasional higher-load sessions are part of the "chaos" in chaos with guardrails.',
  },
  {
    q: 'What do the ring colours mean?',
    a: 'Red = under 50% of target. Orange = 50–75%. Yellow = 75–100%. Green = complete.',
  },
  {
    q: 'What does the grade mean?',
    a: 'The weekly grade (D through S) reflects how much of your target volume you have hit across all primary muscles. It drives the accent colour of the app.',
  },
];

export default function YouScreen() {
  const {
    weekTarget,
    workoutHistory,
    setWeekTarget,
    exportData,
    importData,
    resetWeek,
  } = useWorkoutStore();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleExport = async () => {
    const json = exportData();
    try {
      await Share.share({ message: json, title: 'Chaos with Guardrails — Workout Data' });
    } catch {
      Alert.alert('Export failed', 'Could not share data.');
    }
  };

  const handleResetWeek = () => {
    Alert.alert(
      'Reset This Week',
      'This will remove all workouts logged this week. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetWeek(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>You</Text>

        {/* ── Weekly target ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>WEEKLY SET TARGET</Text>
          <Text style={styles.sectionDesc}>
            This is the number of effective sets per muscle group you are aiming for each week.
            The session builder uses this to calculate priority and session size.
          </Text>
          <View style={styles.targetCards}>
            {SET_TARGET_OPTIONS.map((opt) => {
              const selected = weekTarget === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.targetCard,
                    selected && { borderColor: COLOURS.pull, backgroundColor: COLOURS.pull + '18' },
                  ]}
                  onPress={() => setWeekTarget(opt.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.targetCardTop}>
                    <Text style={[styles.targetLabel, selected && { color: COLOURS.pull }]}>
                      {opt.label}
                    </Text>
                    {selected && (
                      <View style={[styles.selectedPill, { backgroundColor: COLOURS.pull }]}>
                        <Text style={styles.selectedPillText}>Selected</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.targetDesc}>{opt.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Data ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DATA</Text>
          <View style={styles.dataCard}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Total workouts logged</Text>
              <Text style={styles.dataValue}>{workoutHistory.length}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleExport}>
            <Text style={styles.actionBtnText}>Export Workout Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={handleResetWeek}
          >
            <Text style={[styles.actionBtnText, { color: COLOURS.danger }]}>
              Reset This Week
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>HOW IT WORKS</Text>
          {FAQ_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Text style={styles.faqChevron}>{expandedFaq === i ? '▲' : '▼'}</Text>
              </View>
              {expandedFaq === i && (
                <Text style={styles.faqA}>{item.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── App info ──────────────────────────────────────────────────── */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Chaos with Guardrails</Text>
          <Text style={styles.appInfoSub}>Version 1.0.0</Text>
          <Text style={styles.appInfoDesc}>
            Structured unpredictability. Track what matters. Train what needs work.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.base },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingTop: SPACING.lg },
  pageTitle: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '900',
    marginBottom: SPACING.lg,
  },
  section: { marginBottom: SPACING.xl },
  sectionHeader: {
    color: COLOURS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  sectionDesc: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  targetCards: { gap: SPACING.sm },
  targetCard: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLOURS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  targetCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabel: {
    color: COLOURS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '800',
  },
  selectedPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  selectedPillText: {
    color: '#000',
    fontSize: FONT.xs,
    fontWeight: '700',
  },
  targetDesc: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    lineHeight: 18,
  },
  dataCard: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    color: COLOURS.textSecondary,
    fontSize: FONT.md,
  },
  dataValue: {
    color: COLOURS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLOURS.border,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dangerBtn: {
    borderColor: COLOURS.danger + '66',
  },
  actionBtnText: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  faqItem: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  faqQ: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
    flex: 1,
  },
  faqChevron: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    marginTop: 3,
  },
  faqA: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
  appInfoTitle: {
    color: COLOURS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '900',
  },
  appInfoSub: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
  },
  appInfoDesc: {
    color: COLOURS.textMuted,
    fontSize: FONT.sm,
    textAlign: 'center',
    marginTop: SPACING.xs,
    maxWidth: 260,
  },
});
