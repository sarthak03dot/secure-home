

#include <ESPmDNS.h>
#include <WiFi.h>
#include <WebServer.h>

// const char* ssid = "free";
const char* ssid = "Pradhanmantri";
const char* password = "qprdst23";

WebServer server(80);

// ===== PINS =====
#define RELAY1 5
#define RELAY2 4
#define PIR 18
#define LDR 34
#define TRIG 13
#define ECHO 14
#define BUZZER 21
#define LED_FAN 23
#define LED_LIGHT 22

// ===== STATES =====
bool relayLight = false;
bool relayFan = false;

bool manualLight = false;
bool manualFan = false;

String detectMode = "off"; // pir / ultra / both / off

long duration;
int distance;
int lightValue;
bool motion;

int threshold = 1500;

// ===== SENSOR READ =====
void readSensors() {
  static unsigned long motionTimer = 0;

  if (digitalRead(PIR)) {
    motion = true;
    motionTimer = millis();
  }

  if (millis() - motionTimer > 3000) {
    motion = false;
  }

  // LDR
  lightValue = analogRead(LDR);

  // ULTRASONIC
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  duration = pulseIn(ECHO, HIGH, 30000);

  static int lastDistance = 0;

  if (duration != 0) {
    int rawDistance = duration * 0.034 / 2;

    if (rawDistance > 300) rawDistance = 300;
    if (rawDistance < 2) rawDistance = 0;

    distance = (lastDistance + rawDistance) / 2;
    lastDistance = distance;
  }
}

// ===== DETECTION CHECK =====
bool isTriggered() {
  if (detectMode == "pir") return motion;
  if (detectMode == "ultra") return (distance > 0 && distance < 20);
  if (detectMode == "both") return (motion || (distance > 0 && distance < 20));
  return false;
}

// ===== AUTOMATION =====
// void automation() {

//   bool trigger = isTriggered();

//   // ===== LDR FILTER =====
//   static int filteredLight = 0;
//   filteredLight = (filteredLight * 3 + lightValue) / 4;

//   int darkThreshold = threshold;
//   int lightThreshold = threshold + 500;

//   static bool isDark = false;
  

//   // if (filteredLight > darkThreshold) {
//   //   isDark = true;
//   // } 
//   // else if (filteredLight < lightThreshold) {
//   //   isDark = false;
//   // }
//   if (filteredLight < darkThreshold) {
//     isDark = true;
//   } 
//   else if (filteredLight > lightThreshold) {
//     isDark = false;
//   }
//   // LIGHT (ONLY LDR BASED)
//   if (!manualLight) {
//     relayLight = isDark;
//   }

//   // FAN (trigger based)
//   if (!manualFan) {
//     relayFan = trigger;
//   }

//   // OUTPUT
//   digitalWrite(RELAY1, relayLight ? LOW : HIGH);
//   digitalWrite(RELAY2, relayFan ? LOW : HIGH);

//   digitalWrite(LED_LIGHT, relayLight ? HIGH : LOW);
//   digitalWrite(LED_FAN, relayFan ? HIGH : LOW);

//   // BUZZER
//   static unsigned long buzzTimer = 0;
//   static bool buzzState = false;

//   if (trigger) {
//     if (millis() - buzzTimer > 300) {
//       buzzTimer = millis();
//       buzzState = !buzzState;
//       digitalWrite(BUZZER, buzzState);
//     }
//   } else {
//     digitalWrite(BUZZER, LOW);
//   }
// }
void automation() {

  bool trigger = isTriggered();

  // ===== LDR FILTER =====
  static int filteredLight = 0;
  filteredLight = (filteredLight * 3 + lightValue) / 4;

  int darkThreshold = threshold;
  int lightThreshold = threshold + 500;

  static bool isDark = false;

  //  CORRECT LOGIC (NO CHANGE NEEDED NOW)
  if (filteredLight < darkThreshold) {
    isDark = true;
  } 
  else if (filteredLight > lightThreshold) {
    isDark = false;
  }

  //  LIGHT (ONLY LDR BASED)
  if (!manualLight) {
    relayLight = isDark;
  }

  //  FAN (trigger based)
  if (!manualFan) {
    relayFan = trigger;
  }

  // 🔌 OUTPUT (Active LOW relay)
  digitalWrite(RELAY1, relayLight ? LOW : HIGH);
  digitalWrite(RELAY2, relayFan ? LOW : HIGH);

  digitalWrite(LED_LIGHT, relayLight ? HIGH : LOW);
  digitalWrite(LED_FAN, relayFan ? HIGH : LOW);

  //  BUZZER
  static unsigned long buzzTimer = 0;
  static bool buzzState = false;

  if (trigger) {
    if (millis() - buzzTimer > 300) {
      buzzTimer = millis();
      buzzState = !buzzState;
      digitalWrite(BUZZER, buzzState);
    }
  } else {
    digitalWrite(BUZZER, LOW);
  }

  //  DEBUG (VERY IMPORTANT)
  Serial.print("LDR: ");
  Serial.print(lightValue);
  Serial.print(" | Filtered: ");
  Serial.print(filteredLight);
  Serial.print(" | isDark: ");
  Serial.println(isDark);
}
// ===== API =====
void handleData() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  String json = "{";
  json += "\"status\":\"success\",";
  json += "\"data\":{";
  json += "\"motion\":" + String(motion ? "true" : "false") + ",";
  json += "\"light\":" + String(lightValue) + ",";
  json += "\"distance\":" + String(distance) + ",";
  json += "\"relay_light\":" + String(relayLight ? "false" : "true") + ",";
  json += "\"relay_fan\":" + String(relayFan ? "true" : "false") + ",";
  json += "\"mode\":\"" + detectMode + "\",";
  json += "\"uptime\":" + String(millis() / 1000);
  json += "}";
  json += "}";

  server.send(200, "application/json", json);
}

// ===== RELAY CONTROL =====
void handleRelay() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (server.hasArg("light")) {
    manualLight = true;
    relayLight = (server.arg("light") == "on");
  }

  if (server.hasArg("fan")) {
    manualFan = true;
    relayFan = (server.arg("fan") == "on");
  }

  if (server.hasArg("auto")) {
    manualLight = false;
    manualFan = false;
  }

  server.send(200, "text/plain", "OK");
}

// ===== MODE CONTROL =====
void handleMode() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (server.hasArg("type")) {
    detectMode = server.arg("type");
  }

  server.send(200, "text/plain", detectMode);
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);

  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
  pinMode(PIR, INPUT);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(LED_FAN, OUTPUT);
  pinMode(LED_LIGHT, OUTPUT);

  digitalWrite(RELAY1, HIGH);
  digitalWrite(RELAY2, HIGH);
  digitalWrite(BUZZER, LOW);
  digitalWrite(LED_FAN, LOW);
  digitalWrite(LED_LIGHT, LOW);

  // WiFi
  WiFi.begin(ssid, password);

  Serial.print("Connecting...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n WiFi Connected");

  if (!MDNS.begin("secure-home")) {
    Serial.println(" mDNS failed");
  } else {
    Serial.println(" http://secure-home.local");
  }

  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  server.on("/data", handleData);
  server.on("/relay", handleRelay);
  server.on("/mode", handleMode);

  server.begin();
}

// ===== LOOP =====
void loop() {
  readSensors();
  automation();
  server.handleClient();

  static unsigned long lastPrint = 0;

  if (millis() - lastPrint > 1000) {
    lastPrint = millis();

    Serial.println("\n STATUS");
    Serial.print("Mode: "); Serial.println(detectMode);
    Serial.print("Motion: "); Serial.println(motion);
    Serial.print("Distance: "); Serial.println(distance);
    Serial.print("Light: "); Serial.println(lightValue);
    Serial.print("Light Relay: "); Serial.println(relayLight);
    Serial.print("Fan Relay: "); Serial.println(relayFan);
  }
}