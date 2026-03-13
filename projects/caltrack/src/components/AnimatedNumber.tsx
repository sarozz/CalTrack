import React from 'react';
import { Animated, Easing, Text, type TextProps } from 'react-native';

type Props = {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
} & Omit<TextProps, 'children'>;

export function AnimatedNumber({ value, durationMs = 650, format, ...props }: Props) {
  const anim = React.useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = React.useState(value);

  React.useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(v));
    return () => anim.removeListener(id);
  }, [anim]);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, durationMs, anim]);

  const text = format ? format(display) : String(Math.round(display));
  return <Text {...props}>{text}</Text>;
}
