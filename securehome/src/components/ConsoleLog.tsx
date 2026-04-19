import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Terminal } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { LogEntry } from '../types';

interface ConsoleLogProps {
  logs: LogEntry[];
}

const ConsoleLog: React.FC<ConsoleLogProps> = ({ logs }) => {
  const scrollViewRef = React.useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Terminal size={14} color={COLORS.primary} />
        <Text style={styles.headerText}>ENCRYPTED PACKET STREAM</Text>
      </View>
      <ScrollView 
        style={styles.logContainer}
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>Waiting for telemetry...</Text>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logLine}>
              <Text style={styles.timestamp}>[{log.timestamp}]</Text>
              <Text style={styles.logType}>{log.type}</Text>
              <Text style={styles.logValue} numberOfLines={1}>{log.value}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    height: 200,
    marginHorizontal: 16,
    marginVertical: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    gap: 8,
  },
  headerText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
  },
  logContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 10,
    fontStyle: 'italic',
  },
  logLine: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
    paddingLeft: 8,
  },
  timestamp: {
    fontSize: 9,
    color: COLORS.textDim,
    width: 60,
  },
  logType: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    width: 70,
  },
  logValue: {
    fontSize: 9,
    color: '#ccc',
    flex: 1,
  },
});

export default ConsoleLog;
