import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '../src/store/workoutStore';
import { COLOURS, FONT, RADIUS, SPACING } from '../src/theme';

const STEPS = [
  {
    title: 'Chaos with Guardrails',
    subtitle: 'Structured unpredictability for serious training',
    body: 'Track muscle groups — directly and indirectly. The app figures out what needs work and builds a session around it, with just enough randomness to keep things interesting.',
    icon: '⚡',
  },
  {
    title: 'Six Primary Muscles',
    subtitle: 'The rings tell the story',
    body: 'Chest, lats, upper back, quads, glutes, and hamstrings. Hit your weekly target for each and the grade climbs. The accent colour shifts as the week improves.',
    icon: '◎',
  },
  {
    title: 'Smart Session Builder',
    subtitle: 'One tap. A full session.',
    body: 'The builder scores every exercise against your current week, respects axial load limits, biases toward posterior chain work, and shuffles the order so no two sessions feel the same.',
    icon: '🎯',
  },
  {
    title: 'The Nudge',
    subtitle: 'Finish what you started',
    body: 'When you are within 2 sets of completing a muscle group, the app will suggest a quick finisher. No notifications — just a card that appears when it matters.',
    icon: '🔥',
  },
];

const SET_OPTIONS = [
  { value: 5, label: '5 sets', description: 'Maintenance' },
  { value: 10, label: '10 sets', description: 'Balanced' },
  { value: 15, label: '15 sets', description: 'High volume' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setWeekTarget, setHasOnboarded } = useWorkoutStore();
  const [step, setStep] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState(10);

  const isLast = step === STEPS.length;

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep((s) => s + 1);
    } else {
      setWeekTarget(selectedTarget);
      setHasOnboarded(true);
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (isLast) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.stepIcon}>🎯</Text>
          <Text style={styles.title}>Set Your Weekly Target</Text>
          <Text style={styles.subtitle}>
            How many effective sets per muscle group are you aiming for each week?
          </Text>
          <View style={styles.targetOptions}>
            {SET_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.targetCard,
                  selectedTarget === opt.value && {
                    borderColor: COLOURS.pull,
                    backgroundColor: COLOURS.pull + '18',
                  },
                ]}
                onPress={() => setSelectedTarget(opt.value)}
              >
                <Text
                  style={[
                    styles.targetLabel,
                    selectedTarget === opt.value && { color: COLOURS.pull },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text style={styles.targetDesc}>{opt.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.changeNote}>You can change this any time in the You tab.</Text>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: COLOURS.pull }]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>Let's Go</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {[...STEPS, { title: 'target' }].map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.stepContent}>
          <Text style={styles.stepIcon}>{current.icon}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </View>

        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: COLOURS.pull }]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {step === STEPS.length - 1 ? 'Set Target' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.base },
  container: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: SPACING.xs,
    justifyContent: 'center',
    paddingTop: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLOURS.border,
  },
  dotActive: {
    backgroundColor: COLOURS.pull,
    width: 24,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  stepIcon: {
    fontSize: 64,
  },
  title: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLOURS.pull,
    fontSize: FONT.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: COLOURS.textSecondary,
    fontSize: FONT.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  navRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backBtn: {
    flex: 1,
    backgroundColor: COLOURS.surfaceHigh,
    borderRadius: RADIUS.full,
    padding: SPACING.md,
    alignItems: 'center',
  },
  backBtnText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 2,
    borderRadius: RADIUS.full,
    padding: SPACING.md,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#000',
    fontSize: FONT.md,
    fontWeight: '900',
  },
  targetOptions: {
    gap: SPACING.sm,
    width: '100%',
    marginTop: SPACING.lg,
  },
  targetCard: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLOURS.border,
    padding: SPACING.md,
    gap: 4,
  },
  targetLabel: {
    color: COLOURS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '800',
  },
  targetDesc: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
  },
  changeNote: {
    color: COLOURS.textMuted,
    fontSize: FONT.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
