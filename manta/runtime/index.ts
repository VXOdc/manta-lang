/**
 * @manta/runtime
 *
 * The Manta standard runtime. Provides implementations for all built-in
 * language constructs: camera control, object detection, tracking, prediction,
 * speech synthesis, LLM queries, and sensor management.
 *
 * In production, swap out the stub implementations with real backends
 * (YOLO, MediaPipe, Web Speech API, Anthropic SDK, etc.).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DetectionResult {
  detected: boolean;
  label: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  distance?: number;
}

export interface TrackingResult {
  id: string;
  label: string;
  position: { x: number; y: number };
  velocity: { dx: number; dy: number };
}

export interface TrajectoryPrediction {
  points: Array<{ x: number; y: number; t: number }>;
  collisionRisk: number;
  confidence: number;
}

export interface SensorHandle {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  read(): Promise<Record<string, unknown>>;
}

// ─── Runtime state ───────────────────────────────────────────────────────────

let _cameraStream: MediaStream | null = null;
let _detections: Map<string, DetectionResult> = new Map();
let _tracks: Map<string, TrackingResult> = new Map();

// ─── Camera ──────────────────────────────────────────────────────────────────

export const camera = {
  async start(): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      try {
        _cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("[manta] Camera started.");
      } catch (e) {
        console.warn("[manta] Camera access denied. Using stub mode.");
      }
    } else {
      console.log("[manta] Camera started (stub mode — no browser API available).");
    }
  },

  async stop(): Promise<void> {
    if (_cameraStream) {
      _cameraStream.getTracks().forEach((t) => t.stop());
      _cameraStream = null;
    }
    console.log("[manta] Camera stopped.");
  },

  get stream(): MediaStream | null {
    return _cameraStream;
  },
};

// ─── Detection ───────────────────────────────────────────────────────────────

/**
 * Detect an object by label in the current camera frame.
 *
 * Production: replace with YOLO/TensorFlow.js/Roboflow call.
 * Stub: returns a randomised result for development/demo purposes.
 */
export async function detect(label: string): Promise<DetectionResult> {
  // Stub implementation — replace with real model inference
  const detected = Math.random() > 0.3;
  const result: DetectionResult = {
    detected,
    label,
    confidence: detected ? 0.7 + Math.random() * 0.3 : 0,
    boundingBox: detected
      ? { x: Math.random() * 0.5, y: Math.random() * 0.5, width: 0.2, height: 0.3 }
      : undefined,
    distance: detected ? 1 + Math.random() * 9 : undefined,
  };
  _detections.set(label, result);
  console.log(`[manta] detect("${label}") →`, result.detected ? `✓ ${(result.confidence * 100).toFixed(0)}%` : "✗");
  return result;
}

// ─── Tracking ────────────────────────────────────────────────────────────────

export async function track(label: string): Promise<TrackingResult> {
  const existing = _detections.get(label);
  const result: TrackingResult = {
    id: `${label}-${Date.now()}`,
    label,
    position: { x: Math.random(), y: Math.random() },
    velocity: { dx: (Math.random() - 0.5) * 0.1, dy: (Math.random() - 0.5) * 0.1 },
  };
  _tracks.set(label, result);
  console.log(`[manta] track("${label}") → id=${result.id}`);
  return result;
}

// ─── Prediction ──────────────────────────────────────────────────────────────

export async function predict(what: string): Promise<TrajectoryPrediction> {
  const trackData = _tracks.get(what);
  const risk = trackData
    ? Math.min(1, Math.abs(trackData.velocity.dx * 10) + Math.abs(trackData.velocity.dy * 10))
    : Math.random();

  const prediction: TrajectoryPrediction = {
    points: Array.from({ length: 5 }, (_, i) => ({
      x: 0.5 + (trackData?.velocity.dx ?? 0.05) * i * 10,
      y: 0.5 + (trackData?.velocity.dy ?? 0.03) * i * 10,
      t: i * 0.5,
    })),
    collisionRisk: risk,
    confidence: 0.6 + Math.random() * 0.4,
  };

  console.log(`[manta] predict("${what}") → collision_risk=${risk.toFixed(2)}`);
  return prediction;
}

// ─── Speech ──────────────────────────────────────────────────────────────────

export async function speak(message: string): Promise<void> {
  console.log(`[manta] speak: "${message}"`);
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    await new Promise<void>((resolve) => {
      utterance.onend = () => resolve();
    });
  }
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function alert(message: string): Promise<void> {
  console.warn(`[manta] ALERT: "${message}"`);
  if (typeof window !== "undefined") {
    // In browser: show a non-blocking notification
    const event = new CustomEvent("manta:alert", { detail: { message } });
    window.dispatchEvent(event);
  }
}

// ─── LLM / Ask ───────────────────────────────────────────────────────────────

export async function ask(prompt: string): Promise<string> {
  console.log(`[manta] ask: "${prompt}"`);

  // Production: replace with Anthropic SDK call
  // import Anthropic from "@anthropic-ai/sdk";
  // const client = new Anthropic();
  // const msg = await client.messages.create({ model: "claude-sonnet-4-6", max_tokens: 1024, messages: [{ role: "user", content: prompt }] });
  // return msg.content[0].text;

  return `[stub response to: "${prompt}"]`;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

export function log(value: unknown): void {
  console.log("[manta]", value);
}

// ─── Sensors ─────────────────────────────────────────────────────────────────

const _sensors: Map<string, SensorHandle> = new Map();

export function sensor(deviceId: string): SensorHandle {
  if (!_sensors.has(deviceId)) {
    _sensors.set(deviceId, {
      async connect() {
        console.log(`[manta] sensor("${deviceId}").connect()`);
      },
      async disconnect() {
        console.log(`[manta] sensor("${deviceId}").disconnect()`);
      },
      async read() {
        return { timestamp: Date.now(), value: Math.random() };
      },
    });
  }
  return _sensors.get(deviceId)!;
}

// ─── Internal utilities ──────────────────────────────────────────────────────

export const __manta = {
  version: "0.1.0",
  detections: _detections,
  tracks: _tracks,
};
