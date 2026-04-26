/**
 * ConfettiBurst
 *
 * A lightweight, self-contained confetti explosion built with
 * react-native-svg + react-native-reanimated. No third-party confetti
 * library required.
 *
 * Props:
 *   visible   — mount/unmount trigger
 *   intensity — 'small' (exercise log) | 'large' (session complete)
 *   onDone    — called when the animation finishes
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Particle colours ──────────────────────────────────────────────────────────
const COLOURS = [
  '#FF6B6B', '#4ECDC4', '#A29BFE', '#FDCB6E',
  '#27AE60', '#00BFA5', '#E67E22', '#C0392B',
];

// ── Particle shape ────────────────────────────────────────────────────────────
type Shape = 'rect' | 'circle';

interface Particle {
  id: number;
  x: number;       // start X (relative to burst origin)
  y: number;       // start Y
  vx: number;      // horizontal velocity
  vy: number;      // vertical velocity (negative = upward)
  colour: string;
  shape: Shape;
  size: number;
  delay: number;
}

function makeParticles(count: number, originX: number, originY: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const speed = 80 + Math.random() * 180;
    return {
      id: i,
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60, // bias upward
      colour: COLOURS[i % COLOURS.length],
      shape: i % 3 === 0 ? 'circle' : 'rect',
      size: 6 + Math.random() * 8,
      delay: Math.random() * 100,
    };
  });
}

// ── Single animated particle ──────────────────────────────────────────────────
function AnimatedParticle({
  particle,
  duration,
  onDone,
}: {
  particle: Particle;
  duration: number;
  onDone?: () => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const gravity = 300; // px/s²
    const t = duration / 1000;
    const finalX = particle.vx * t;
    const finalY = particle.vy * t + 0.5 * gravity * t * t;

    tx.value = withDelay(
      particle.delay,
      withTiming(finalX, { duration, easing: Easing.out(Easing.quad) }),
    );
    ty.value = withDelay(
      particle.delay,
      withTiming(finalY, { duration, easing: Easing.in(Easing.quad) }),
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration }),
    );
    opacity.value = withDelay(
      particle.delay + duration * 0.5,
      withTiming(0, { duration: duration * 0.5 }, (finished) => {
        if (finished && onDone) runOnJS(onDone)();
      }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
    position: 'absolute',
    left: particle.x - particle.size / 2,
    top: particle.y - particle.size / 2,
  }));

  return (
    <Animated.View style={animStyle}>
      <Svg width={particle.size} height={particle.size}>
        {particle.shape === 'circle' ? (
          <Circle
            cx={particle.size / 2}
            cy={particle.size / 2}
            r={particle.size / 2}
            fill={particle.colour}
          />
        ) : (
          <Rect
            x={0}
            y={0}
            width={particle.size}
            height={particle.size * 0.6}
            rx={2}
            fill={particle.colour}
          />
        )}
      </Svg>
    </Animated.View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface ConfettiBurstProps {
  visible: boolean;
  intensity?: 'small' | 'large';
  /** Origin as fraction of screen: default centre-top of screen */
  originX?: number;
  originY?: number;
  onDone?: () => void;
}

export function ConfettiBurst({
  visible,
  intensity = 'small',
  originX = SW / 2,
  originY = SH * 0.35,
  onDone,
}: ConfettiBurstProps) {
  if (!visible) return null;

  const count = intensity === 'large' ? 60 : 28;
  const duration = intensity === 'large' ? 1400 : 900;
  const particles = makeParticles(count, originX, originY);

  let doneCount = 0;
  const handleParticleDone = () => {
    doneCount += 1;
    if (doneCount >= count && onDone) onDone();
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <AnimatedParticle
          key={p.id}
          particle={p}
          duration={duration}
          onDone={p.id === 0 ? handleParticleDone : undefined}
        />
      ))}
    </View>
  );
}
