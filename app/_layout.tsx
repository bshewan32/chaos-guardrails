import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useWorkoutStore } from '../src/store/workoutStore';
import { COLOURS } from '../src/theme';

export default function RootLayout() {
  const { hasOnboarded } = useWorkoutStore();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLOURS.base }}>
      <StatusBar style="dark" backgroundColor={COLOURS.base} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLOURS.base },
          animation: 'slide_from_right',
        }}
      >
        {!hasOnboarded ? (
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
            <Stack.Screen
              name="session-builder"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="active-session"
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack>
    </GestureHandlerRootView>
  );
}
