import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface IconProps {
  color?: string;
  size?: number;
}

/**
 * Componentes de iconos vectoriales limpios y modernos
 * Construidos 100% con primitivas nativas de React Native (sin emojis ni dependencias externas)
 */

export const HomeIcon: React.FC<IconProps> = ({ color = '#64748B', size = 22 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s }]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.44,
          borderRightWidth: s * 0.44,
          borderBottomWidth: s * 0.36,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          width: s * 0.62,
          height: s * 0.44,
          backgroundColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          marginTop: -1,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            width: s * 0.22,
            height: s * 0.26,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
          }}
        />
      </View>
    </View>
  );
};

export const GridIcon: React.FC<IconProps> = ({ color = '#64748B', size = 20 }) => (
  <View style={[styles.gridContainer, { width: size, height: size }]}>
    <View style={[styles.gridCell, { borderColor: color }]} />
    <View style={[styles.gridCell, { borderColor: color }]} />
    <View style={[styles.gridCell, { borderColor: color }]} />
    <View style={[styles.gridCell, { borderColor: color }]} />
  </View>
);

export const UsersIcon: React.FC<IconProps> = ({ color = '#64748B', size = 22 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s, position: 'relative' }]}>
      <View
        style={{
          width: s * 0.38,
          height: s * 0.38,
          borderRadius: s * 0.19,
          backgroundColor: color,
          marginBottom: 1,
        }}
      />
      <View
        style={{
          width: s * 0.64,
          height: s * 0.32,
          borderTopLeftRadius: s * 0.32,
          borderTopRightRadius: s * 0.32,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: s * 0.08,
          right: s * 0.04,
          width: s * 0.28,
          height: s * 0.28,
          borderRadius: s * 0.14,
          backgroundColor: color,
          opacity: 0.5,
        }}
      />
    </View>
  );
};

export const BellIcon: React.FC<IconProps> = ({ color = '#0F172A', size = 22 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s }]}>
      <View
        style={{
          width: s * 0.18,
          height: s * 0.12,
          borderRadius: 2,
          backgroundColor: color,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: s * 0.58,
          height: s * 0.5,
          borderTopLeftRadius: s * 0.3,
          borderTopRightRadius: s * 0.3,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: s * 0.74,
          height: s * 0.1,
          borderRadius: s * 0.05,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: s * 0.2,
          height: s * 0.12,
          borderBottomLeftRadius: s * 0.1,
          borderBottomRightRadius: s * 0.1,
          backgroundColor: color,
          marginTop: 1,
        }}
      />
    </View>
  );
};

export const ClockIcon: React.FC<IconProps> = ({ color = '#EA580C', size = 20 }) => {
  const s = size;
  return (
    <View
      style={[
        styles.center,
        {
          width: s,
          height: s,
          borderRadius: s / 2,
          borderWidth: 2,
          borderColor: color,
          position: 'relative',
        },
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: s * 0.18,
          width: 2,
          height: s * 0.32,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: s * 0.46,
          left: s * 0.44,
          width: s * 0.26,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

export const SearchIcon: React.FC<IconProps> = ({ color = '#94A3B8', size = 18 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s, position: 'relative' }]}>
      <View
        style={{
          width: s * 0.65,
          height: s * 0.65,
          borderRadius: (s * 0.65) / 2,
          borderWidth: 2,
          borderColor: color,
          marginTop: -s * 0.15,
          marginLeft: -s * 0.15,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: s * 0.1,
          right: s * 0.1,
          width: 2.2,
          height: s * 0.38,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
};

export const ShieldIcon: React.FC<IconProps> = ({ color = '#65A30D', size = 18 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s }]}>
      <View
        style={{
          width: s * 0.76,
          height: s * 0.88,
          borderTopLeftRadius: s * 0.15,
          borderTopRightRadius: s * 0.15,
          borderBottomLeftRadius: s * 0.38,
          borderBottomRightRadius: s * 0.38,
          borderWidth: 2,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: s * 0.25,
            height: s * 0.38,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  );
};

export const ComputerIcon: React.FC<IconProps> = ({ color = '#0284C7', size = 18 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s }]}>
      <View
        style={{
          width: s * 0.86,
          height: s * 0.6,
          borderRadius: 3,
          borderWidth: 1.8,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: s * 0.45, height: 1.5, backgroundColor: color }} />
      </View>
      <View style={{ width: 2, height: s * 0.12, backgroundColor: color }} />
      <View
        style={{
          width: s * 0.5,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
};

export const ZapIcon: React.FC<IconProps> = ({ color = '#65A30D', size = 18 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s }]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.25,
          borderRightWidth: s * 0.15,
          borderTopWidth: s * 0.45,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          transform: [{ rotate: '15deg' }],
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.15,
          borderRightWidth: s * 0.25,
          borderBottomWidth: s * 0.45,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          marginTop: -s * 0.18,
          transform: [{ rotate: '15deg' }],
        }}
      />
    </View>
  );
};

export const SparkleIcon: React.FC<IconProps> = ({ color = '#4D7C0F', size = 16 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s, position: 'relative' }]}>
      <View
        style={{
          position: 'absolute',
          width: s * 0.25,
          height: s,
          backgroundColor: color,
          borderRadius: s * 0.12,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: s,
          height: s * 0.25,
          backgroundColor: color,
          borderRadius: s * 0.12,
        }}
      />
    </View>
  );
};

export const DocumentIcon: React.FC<IconProps> = ({ color = '#4D7C0F', size = 20 }) => {
  const s = size;
  return (
    <View
      style={[
        styles.center,
        {
          width: s * 0.75,
          height: s * 0.95,
          borderRadius: 3,
          borderWidth: 1.8,
          borderColor: color,
          padding: 2,
          justifyContent: 'space-around',
        },
      ]}
    >
      <View style={{ width: '70%', height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: '85%', height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: '50%', height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
};

export const WifiOffIcon: React.FC<IconProps> = ({ color = '#DC2626', size = 24 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s, position: 'relative' }]}>
      <View
        style={{
          width: s * 0.8,
          height: s * 0.4,
          borderTopLeftRadius: s * 0.4,
          borderTopRightRadius: s * 0.4,
          borderTopWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: s * 0.5,
          height: s * 0.25,
          borderTopLeftRadius: s * 0.25,
          borderTopRightRadius: s * 0.25,
          borderTopWidth: 2,
          borderColor: color,
          marginTop: -2,
        }}
      />
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
          marginTop: 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 2,
          height: s * 0.9,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

export const PlusIcon: React.FC<IconProps> = ({ color = '#FFFFFF', size = 20 }) => {
  const s = size;
  return (
    <View style={[styles.center, { width: s, height: s, position: 'relative' }]}>
      <View
        style={{
          position: 'absolute',
          width: 2.5,
          height: s * 0.75,
          backgroundColor: color,
          borderRadius: 1.5,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: s * 0.75,
          height: 2.5,
          backgroundColor: color,
          borderRadius: 1.5,
        }}
      />
    </View>
  );
};

export const ArrowRightIcon: React.FC<IconProps> = ({ color = '#0F172A', size = 16 }) => {
  const s = size;
  return (
    <View
      style={{
        width: s * 0.5,
        height: s * 0.5,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
};

export const ArrowLeftIcon: React.FC<IconProps> = ({ color = '#0F172A', size = 16 }) => {
  const s = size;
  return (
    <View
      style={{
        width: s * 0.5,
        height: s * 0.5,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
};

export const AppIconBadge: React.FC<{ software: string; size?: number }> = ({ software, size = 42 }) => {
  const s = software.toLowerCase();
  let bg = '#F0FDF4';
  let txtColor = '#15803D';
  let label = software.substring(0, 2).toUpperCase();

  if (s.includes('figma')) {
    bg = '#FAF5FF';
    txtColor = '#7E22CE';
    label = 'Fg';
  } else if (s.includes('microsoft') || s.includes('365') || s.includes('office')) {
    bg = '#F0F9FF';
    txtColor = '#0284C7';
    label = 'MS';
  } else if (s.includes('adobe') || s.includes('creative')) {
    bg = '#FEF2F2';
    txtColor = '#DC2626';
    label = 'Ad';
  } else if (s.includes('slack')) {
    bg = '#FDF2F8';
    txtColor = '#BE185D';
    label = 'Sl';
  } else if (s.includes('zoom')) {
    bg = '#EFF6FF';
    txtColor = '#1D4ED8';
    label = 'Zm';
  }

  return (
    <View
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.04)',
        },
      ]}
    >
      <Text style={{ fontSize: Math.round(size * 0.38), fontWeight: '700', color: txtColor, letterSpacing: -0.5 }}>
        {label}
      </Text>
    </View>
  );
};

export const CheckCircleIcon: React.FC<IconProps> = ({ color = '#107C41', size = 44 }) => {
  const s = size;
  return (
    <View
      style={[
        styles.center,
        {
          width: s,
          height: s,
          borderRadius: s / 2,
          backgroundColor: '#D1FAE5',
          borderWidth: 2,
          borderColor: color,
        },
      ]}
    >
      <View
        style={{
          width: s * 0.42,
          height: s * 0.22,
          borderBottomWidth: 3,
          borderLeftWidth: 3,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
          marginTop: -s * 0.08,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  gridCell: {
    width: '45%',
    height: '45%',
    borderWidth: 1.8,
    borderRadius: 2,
  },
});
