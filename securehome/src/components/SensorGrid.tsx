import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../theme/colors';
import { 
  Radar, 
  Eye, 
  Sun, 
  Activity,
  LucideIcon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

interface SensorCardProps {
  title: string;
  value: string | number;
  status: string;
  subtext: string;
  icon: LucideIcon;
  isActive: boolean;
  activeColor: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ 
  title, 
  value, 
  status, 
  subtext, 
  icon: Icon, 
  isActive, 
  activeColor 
}) => {
  return (
    <View style={[
      styles.card, 
      isActive && { borderColor: activeColor + '40', borderWidth: 1 }
    ]}>
      <View style={styles.header}>
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isActive ? activeColor + '20' : COLORS.glass }
        ]}>
          <Icon size={24} color={isActive ? activeColor : COLORS.textDim} />
        </View>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.dot, 
            { backgroundColor: isActive ? activeColor : COLORS.textDim }
          ]} />
          <Text style={[
            styles.statusText, 
            { color: isActive ? activeColor : COLORS.textDim }
          ]}>
            {isActive ? 'ACTIVE' : 'IDLE'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.statusLabel}>{status}</Text>
        
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.subtext}>{subtext}</Text>
        </View>
      </View>
    </View>
  );
};

interface SensorGridProps {
  data: {
    motion: boolean;
    distance: number;
    light: number;
    loading: boolean;
  };
}

const SensorGrid: React.FC<SensorGridProps> = ({ data }) => {
  const isProximityAlert = data.distance > 0 && data.distance < 20;

  return (
    <View style={styles.grid}>
      <SensorCard
        title="Motion"
        status={data.motion ? "Active Scan" : "Monitoring"}
        icon={Radar}
        activeColor={COLORS.danger}
        isActive={data.motion}
        value={data.motion ? "ALERT" : "SAFE"}
        subtext="PIR Core"
      />
      <SensorCard
        title="Proximity"
        status={isProximityAlert ? "Close Vector" : "Clear Path"}
        icon={Eye}
        activeColor={COLORS.warning}
        isActive={isProximityAlert}
        value={`${data.distance}CM`}
        subtext="Ultrasonic"
      />
      <SensorCard
        title="Luminance"
        status="Ambient Flux"
        icon={Sun}
        activeColor={COLORS.accent}
        isActive={data.light < 1000}
        value={data.light}
        subtext="LDR Sensor"
      />
      <SensorCard
        title="Neural"
        status="System Health"
        icon={Activity}
        activeColor={COLORS.success}
        isActive={!data.loading}
        value="OK"
        subtext="ESP32-S3"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  card: {
    width: cardWidth,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 2,
  },
  statusIndicator: {
    alignItems: 'flex-end',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  content: {
    marginTop: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusLabel: {
    fontSize: 9,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  subtext: {
    fontSize: 9,
    color: COLORS.textDim,
    fontWeight: '700',
  },
});

export default SensorGrid;
