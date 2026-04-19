import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Settings, Zap, Wifi, WifiOff, X, AlertTriangle } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, GRADIENTS } from './src/theme/colors';
import { StorageService } from './src/services/StorageService';
import { TelemetryData, LogEntry } from './src/types';

import RadarScanner from './src/components/RadarScanner';
import SensorGrid from './src/components/SensorGrid';
import ControlPanel from './src/components/ControlPanel';
import ConsoleLog from './src/components/ConsoleLog';

function App() {
  const isDarkMode = true; // Forcing dark mode for the premium look
  const [espIp, setEspIp] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempIp, setTempIp] = useState('');
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<TelemetryData>({
    motion: false,
    light: 0,
    distance: 0,
    relay_light: false,
    relay_fan: false,
    mode: 'off',
    uptime: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Load IP on startup
  useEffect(() => {
    StorageService.getEspIp().then((ip) => {
      setEspIp(ip);
      setTempIp(ip);
    });
  }, []);

  const addLog = useCallback((type: string, value: string) => {
    setLogs((prev) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        value,
        timestamp: new Date().toLocaleTimeString(),
      };
      return [newLog, ...prev].slice(0, 20);
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!espIp) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
      const response = await fetch(`${espIp}/data`, { signal: controller.signal });
      const json = await response.json();
      if (json.status === 'success') {
        const newData = json.data;

        // Log changes
        if (newData.motion !== data.motion) addLog('MOTION', newData.motion ? 'DETECTED' : 'CLEAR');
        if (Math.abs(newData.distance - data.distance) > 5) addLog('RANGE', `${newData.distance}cm`);
        if (newData.relay_light !== data.relay_light) addLog('LIGHT', newData.relay_light ? 'ON' : 'OFF');
        if (newData.relay_fan !== data.relay_fan) addLog('FAN', newData.relay_fan ? 'ON' : 'OFF');

        setData(newData);
        setIsConnected(true);
        setLoading(false);
      }
    } catch (error) {
      setIsConnected(false);
      setLoading(false);
    } finally {
      clearTimeout(timeoutId);
    }
  }, [espIp, data, addLog]);

  useEffect(() => {
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleControl = async (device: string, state: string) => {
    try {
      await fetch(`${espIp}/relay?${device}=${state}`);
      fetchData();
    } catch (error) {
      Alert.alert('Control Error', 'Failed to communicate with device');
    }
  };

  const handleModeChange = async (mode: string) => {
    try {
      await fetch(`${espIp}/mode?type=${mode}`);
      fetchData();
    } catch (error) {
      Alert.alert('Mode Error', 'Failed to change mode');
    }
  };

  const saveSettings = async () => {
    await StorageService.setEspIp(tempIp);
    setEspIp(tempIp);
    setShowSettings(false);
  };

  const isProximityAlert = data.distance > 0 && data.distance < 20;

  return (
    <SafeAreaProvider>
      <ImageBackground
        source={require('./assets/dashboard_bg.png')}
        style={styles.container}
        imageStyle={{ opacity: 0.4 }}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        <ScrollView style={styles.scrollView} bounces={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View style={styles.logoBox}>
                <Image
                  source={require('./assets/app_icon.png')}
                  style={{ width: 32, height: 32, borderRadius: 2 }}
                />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>SECURE</Text>
                  <Text style={styles.subtitle}>HOME v2.0</Text>
                </View>
                <Text style={styles.coreTag}>NEURAL INTERFACE CORE</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              style={styles.settingsButton}
            >
              <Settings size={22} color={COLORS.textDim} />
            </TouchableOpacity>
          </View>

          {/* Connection Status */}
          <View style={styles.statusSection}>
            <View style={[
              styles.statusChip,
              { backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isConnected ? COLORS.success : COLORS.danger }
              ]} />
              <Text style={[
                styles.statusLabel,
                { color: isConnected ? COLORS.success : COLORS.danger }
              ]}>
                {isConnected ? 'NODE CONNECTED' : 'NODE OFFLINE'}
              </Text>
              {isConnected ? <Wifi size={14} color={COLORS.success} /> : <WifiOff size={14} color={COLORS.danger} />}
            </View>
          </View>

          {/* Radar Scan View */}
          <View style={styles.radarCard}>
            <View style={styles.radarHeader}>
              <Text style={styles.radarTitle}>NEURAL SCAN</Text>
              <View style={[styles.modeIndicator, data.mode !== 'off' && styles.modeIndicatorActive]}>
                <Text style={styles.modeIndicatorText}>{data.mode.toUpperCase()}</Text>
              </View>
            </View>
            <RadarScanner isMotionDetected={data.motion} />
            <View style={styles.radarStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>LATENCY</Text>
                <Text style={styles.statValue}>12ms</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>UPTIME</Text>
                <Text style={styles.statValue}>{Math.floor(data.uptime / 60)}m</Text>
              </View>
            </View>
          </View>

          {/* Sensors Matrix */}
          <SensorGrid data={{ ...data, loading }} />

          {/* Interaction Hub */}
          <View style={styles.hubHeader}>
            <Text style={styles.hubTitle}>INTERACTION HUB</Text>
            <Text style={styles.hubSubtitle}>DIRECT HARDWARE COMMAND INTERFACE</Text>
          </View>

          <ControlPanel
            data={data}
            onControl={handleControl}
            onModeChange={handleModeChange}
          />

          {/* Console */}
          <ConsoleLog logs={logs} />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Security Overlay */}
        {(data.motion || isProximityAlert) && (
          <View style={styles.securityOverlay}>
            <View style={styles.alertIcon}>
              <AlertTriangle size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.alertTitle}>INTRUSION DETECTED</Text>
              <Text style={styles.alertSubtitle}>SECURE PERIMETER BREACH</Text>
            </View>
          </View>
        )}

        {/* Settings Modal */}
        <Modal
          visible={showSettings}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>NODE CONFIG</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <X color={COLORS.textDim} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDesc}>Enter your Node address (IP or mDNS).</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ENDPOINT ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  value={tempIp}
                  onChangeText={setTempIp}
                  placeholder="e.g. 192.168.1.10"
                  placeholderTextColor={COLORS.textDim}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveSettings}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.saveButtonText}>SYNC WITH NODE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    padding: 10,
    borderRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  subtitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 2,
  },
  coreTag: {
    color: COLORS.textDim,
    fontSize: 7,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  settingsButton: {
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statusSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  radarCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 2,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  radarHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  radarTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  modeIndicator: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeIndicatorActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  modeIndicatorText: {
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  radarStats: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    fontSize: 8,
    color: COLORS.textDim,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  hubHeader: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  hubTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  hubSubtitle: {
    fontSize: 9,
    color: COLORS.textDim,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
  },
  securityOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: COLORS.danger,
    borderRadius: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIcon: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  alertTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    fontStyle: 'italic',
  },
  alertSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  modalDesc: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  saveButton: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
  },
});

export default App;
