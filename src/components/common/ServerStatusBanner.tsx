import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { environment } from '../../environments/environment';

type ServerState = 'checking' | 'booting' | 'ready';

const HEALTH_URL = `${environment.API_BASE}/api/health`;
// Show the banner only when on prod; dev server is always local
const POLL_INTERVAL_MS = 4000;
const BOOT_THRESHOLD_MS = 6000; // if no response after 6s, show "booting" banner

export function ServerStatusBanner() {
  const [state, setState] = useState<ServerState>('checking');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const isMounted = useRef(true);
  const bannerShown = useRef(false);

  const ping = async () => {
    try {
      const res = await fetch(HEALTH_URL, { method: 'GET' });
      if (res.ok) {
        if (!isMounted.current) return;
        // Server is up — stop polling permanently
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (bannerShown.current) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }).start(() => {
            if (isMounted.current) setState('ready');
          });
        } else {
          setState('ready');
        }
        return;
      }
    } catch {
      // Server not reachable yet
    }

    if (!isMounted.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= BOOT_THRESHOLD_MS && !bannerShown.current) {
      bannerShown.current = true;
      setState('booting');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
    // Start polling only after first failure
    if (!intervalRef.current) {
      intervalRef.current = setInterval(ping, POLL_INTERVAL_MS);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    startTimeRef.current = Date.now();

    // First ping immediately — interval starts only if this fails
    ping();

    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Don't render anything while checking (within threshold) or once ready
  if (state === 'checking' || state === 'ready') return null;

  return (
    <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
      <View style={styles.row}>
        <BouncingDots />
        <Text style={styles.text}>
          Server is waking up — login may take a moment
        </Text>
      </View>
    </Animated.View>
  );
}

/** Three animated dots to indicate loading */
function BouncingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      );
    Animated.parallel([anim(dot1, 0), anim(dot2, 150), anim(dot3, 300)]).start();
  }, []);

  return (
    <View style={styles.dots}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#f59e0b',
    paddingTop: 44, // safe area approx
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#1c1917',
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1c1917',
  },
});
