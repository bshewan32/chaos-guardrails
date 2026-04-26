import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLOURS, FONT, RADIUS, SPACING } from '../../src/theme';
import { useWorkoutStore } from '../../src/store/workoutStore';

function TabBarIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Today: '◎',
    History: '⏱',
    You: '◉',
  };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icons[label] ?? '●'}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const { buildNewSession, getWeekGrade } = useWorkoutStore();
  const grade = getWeekGrade();

  const handleBuild = () => {
    buildNewSession();
    router.push('/session-builder');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
          tabBarActiveTintColor: grade.accentColour,
          tabBarInactiveTintColor: COLOURS.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ focused }) => <TabBarIcon label="Today" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ focused }) => <TabBarIcon label="History" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="you"
          options={{
            title: 'You',
            tabBarIcon: ({ focused }) => <TabBarIcon label="You" focused={focused} />,
          }}
        />
      </Tabs>

      {/* Persistent FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: grade.accentColour }]}
        onPress={handleBuild}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>⚡</Text>
        <Text style={styles.fabLabel}>Build Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLOURS.surface,
    borderTopColor: COLOURS.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    color: COLOURS.textMuted,
  },
  tabIconFocused: {
    color: COLOURS.textPrimary,
  },
  tabLabel: {
    fontSize: FONT.xs,
    color: COLOURS.textMuted,
    fontWeight: '600',
  },
  tabLabelFocused: {
    color: COLOURS.textPrimary,
  },
  fab: {
    position: 'absolute',
    bottom: 88,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: FONT.lg,
    color: '#000',
  },
  fabLabel: {
    color: '#000',
    fontSize: FONT.md,
    fontWeight: '900',
  },
});
