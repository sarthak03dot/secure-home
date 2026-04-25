import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Lightbulb, Wind } from 'lucide-react-native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

interface ControlCardProps {
  title: string;
  subtitle: string;
  icon: any;
  isActive: boolean;
  activeColor: string;
  onToggle: (state: string) => void;
  onForceOff: () => void;
}

const ControlCard: React.FC<ControlCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  isActive,
  activeColor,
  onToggle,
  onForceOff,
}) => {
  const triggerHaptic = () => {
    ReactNativeHapticFeedback.trigger("impactLight", {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  return (
    <View style={[
      styles.controlCard,
      isActive && { borderColor: activeColor + '60', borderWidth: 1, backgroundColor: activeColor + '10' }
    ]}>
      <View style={styles.cardHeader}>
        <View style={[
          styles.iconBox,
          { backgroundColor: isActive ? activeColor + '20' : COLORS.glass }
        ]}>
          <Icon size={28} color={isActive ? activeColor : COLORS.textDim} />
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? activeColor : COLORS.textDim }]} />
          <Text style={[styles.statusText, { color: isActive ? activeColor : COLORS.textDim }]}>
            {isActive ? 'ACTIVE' : 'STANDBY'}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => { triggerHaptic(); onToggle(isActive ? 'auto' : 'on'); }}
          style={[
            styles.actionButton,
            { backgroundColor: isActive ? activeColor : COLORS.glass }
          ]}
        >
          <Text style={[styles.buttonText, { color: isActive ? '#fff' : COLORS.textDim }]}>
            {isActive ? 'AUTO_MODE' : 'INIT_ON'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => { triggerHaptic(); onForceOff(); }}
          style={[styles.actionButton, styles.offButton]}
        >
          <Text style={styles.buttonText}>HALT_SYS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface ControlPanelProps {
  data: {
    relay_light: boolean;
    relay_fan: boolean;
    mode: string;
  };
  onControl: (device: string, state: string) => void;
  onModeChange: (mode: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ data, onControl, onModeChange }) => {
  return (
    <View style={styles.container}>
      <View style={styles.modeSelector}>
        {['pir', 'ultra', 'both', 'off'].map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => {
              ReactNativeHapticFeedback.trigger("impactMedium");
              onModeChange(mode);
            }}
            style={[
              styles.modeButton,
              data.mode === mode && styles.activeModeButton
            ]}
          >
            <Text style={[
              styles.modeButtonText,
              data.mode === mode && styles.activeModeButtonText
            ]}>
              {mode.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cardsRow}>
        <ControlCard
          title="Optical Matrix"
          subtitle="Primary Illumination"
          icon={Lightbulb}
          isActive={data.relay_light}
          activeColor={COLORS.primary}
          onToggle={(state) => onControl('light', state)}
          onForceOff={() => onControl('light', 'off')}
        />
        
        <ControlCard
          title="Thermal Unit"
          subtitle="Climate Relay"
          icon={Wind}
          isActive={data.relay_fan}
          activeColor={COLORS.secondary}
          onToggle={(state) => onControl('fan', state)}
          onForceOff={() => onControl('fan', 'off')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 6,
    borderRadius: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 2,
  },
  activeModeButton: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textDim,
    letterSpacing: 1.5,
  },
  activeModeButtonText: {
    color: '#fff',
  },
  cardsRow: {
    gap: 16,
  },
  controlCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    padding: 12,
    borderRadius: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    fontStyle: 'italic',
  },
  cardSubtitle: {
    fontSize: 10,
    color: COLORS.textDim,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offButton: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textDim,
    letterSpacing: 1,
  },
});

export default ControlPanel;
