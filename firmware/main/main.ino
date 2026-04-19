#include <ESPmDNS.h>
#include <WiFi.h>
#include <WebServer.h>

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

    // smooth value
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
void automation() {

  bool trigger = isTriggered();

  // 💡 LIGHT CONTROL
  if (!manualLight) {
    relayLight = trigger && (lightValue < 1500);
  }

  // 🌀 FAN CONTROL
  if (!manualFan) {
    relayFan = trigger;
  }

  // APPLY OUTPUTS
  digitalWrite(RELAY1, relayLight ? LOW : HIGH);
  digitalWrite(RELAY2, relayFan ? LOW : HIGH);

  digitalWrite(LED_LIGHT, relayLight ? HIGH : LOW);
  digitalWrite(LED_FAN, relayFan ? HIGH : LOW);

  // 🔔 BUZZER
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
  json += "\"relay_light\":" + String(relayLight ? "true" : "false") + ",";
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

  // 🔄 RESET TO AUTO
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

  // 🔌 Connect WiFi
  WiFi.begin(ssid, password);

  Serial.print("Connecting...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi Connected");

  // 🌐 Start mDNS (ONLY ONCE, AFTER WIFI)
  if (!MDNS.begin("secure-home")) {
    Serial.println("❌ mDNS failed");
  } else {
    Serial.println("✅ mDNS started");
    Serial.println("🌐 http://secure-home.local");
  }

  // Show IP as backup
  Serial.print("🌐 IP: ");
  Serial.println(WiFi.localIP());

  // 🌍 API routes
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

    Serial.println("\n📊 STATUS");
    Serial.print("Mode: "); Serial.println(detectMode);
    Serial.print("Motion: "); Serial.println(motion);
    Serial.print("Distance: "); Serial.println(distance);
    Serial.print("Light: "); Serial.println(lightValue);
    Serial.print("Light Relay: "); Serial.println(relayLight);
    Serial.print("Fan Relay: "); Serial.println(relayFan);
  }
}