import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { styles } from './styles';

interface AudioVisualizerProps {
  active: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ active }) => {
  const animations = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  useEffect(() => {
    if (active) {
      const createAnim = (val: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, {
              toValue: 3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(val, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anims = animations.map((anim, i) => createAnim(anim, i * 100));
      Animated.parallel(anims).start();
    } else {
      animations.forEach((anim) => {
        anim.stopAnimation();
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [active, animations]);

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
};
