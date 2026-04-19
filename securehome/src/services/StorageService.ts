import AsyncStorage from '@react-native-async-storage/async-storage';

const ESP_IP_KEY = 'esp_ip';
const DEFAULT_IP = 'http://secure-home.local';

export const StorageService = {
  getEspIp: async (): Promise<string> => {
    try {
      const ip = await AsyncStorage.getItem(ESP_IP_KEY);
      return ip || DEFAULT_IP;
    } catch (e) {
      return DEFAULT_IP;
    }
  },

  setEspIp: async (ip: string): Promise<void> => {
    try {
      let formattedIp = ip;
      if (!formattedIp.startsWith('http')) {
        formattedIp = `http://${formattedIp}`;
      }
      await AsyncStorage.setItem(ESP_IP_KEY, formattedIp);
    } catch (e) {
      console.error('Failed to save ESP IP', e);
    }
  },
};
