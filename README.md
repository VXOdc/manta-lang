# Manta

**A domain-specific language for AI, computer vision, robotics, and autonomous systems.**

Write what you mean. Compile to TypeScript.

```
camera.start

detect person

if detected:
    track person
    predict trajectory

    if collision_risk > 0.8:
        speak "Danger ahead"
        alert "High collision risk"

ask "Describe the scene"
```

---

## Why Manta?

Most AI workflows in Python look like this:

```python
from ultralytics import YOLO
import cv2

model = YOLO("yolo11n.pt")
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break
    results = model(frame)
    for r in results:
        if "person" in r.names:
            print("Detected")

cap.release()
```

In Manta, that's:

```
camera.start
detect person
if detected:
    print "Detected"
```

Manta doesn't replace Python for general programming. It makes **AI perception workflows 10× shorter**.

---

## Language Reference

### Camera

```
camera.start      # Open the default camera
camera.stop       # Release the camera
```

### Detection

```
detect person     # Run object detection; sets `detected` and `personDetection`
detect car
detect bicycle
```

Returns: `{ detected: boolean, confidence: number, boundingBox, distance }`

### Tracking

```
track person      # Assign persistent tracking ID to detected object
```

### Prediction

```
predict trajectory   # Kalman-filter prediction; sets `collision_risk` (0–1)
```

### Speech

```
speak "Warning, object nearby"
```

### Alerts

```
alert "Collision risk"
```

### LLM queries

```
ask "Summarize this scene"
```

### Variables & functions

```
var threshold = 0.75

fn check_risk:
    if collision_risk > threshold:
        speak "High risk"
```

### Conditionals

```
if detected:
    track person

when person.distance < 2m:
    alert "Too close"
```

### Sensors

```
sensor esp32.connect
sensor esp32.disconnect
```

---

## Compiler Architecture

```
Source (.mt)
    │
    ▼
 Lexer          → Token stream (KEYWORD, IDENTIFIER, STRING, NUMBER, OPERATOR...)
    │
    ▼
 Parser         → Abstract Syntax Tree (recursive descent)
    │
    ▼
 Code Generator → TypeScript source
    │
    ▼
 Runtime        → Executes detect/track/speak/ask/...
```

### Repository structure

```
manta/
├── compiler/
│   ├── lexer/       Token stream from source text
│   ├── parser/      Recursive-descent parser → AST
│   ├── ast/         TypeScript types for all AST nodes
│   ├── codegen/     AST → TypeScript emitter
│   └── index.ts     CLI entry point
│
├── runtime/
│   └── index.ts     detect(), track(), speak(), ask(), camera, sensor
│
├── examples/
│   ├── hello.mt
│   ├── detect_person.mt
│   ├── autonomous_camera.mt
│   └── risk_monitor.mt
│
├── site/
│   └── public/index.html   Landing page (deployed on Vercel)
│
├── vercel.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
git clone https://github.com/your-org/manta
cd manta
npm install
npm run build
```

### Use the CLI

```bash
# Compile a .mt file to TypeScript
npx manta compile examples/detect_person.mt

# Print the token stream
npx manta tokens examples/hello.mt

# Print the AST as JSON
npx manta ast examples/hello.mt

# Compile and run (requires ts-node)
npx manta run examples/hello.mt
```

---

## File extension

Manta programs use the `.mt` extension.

```
hello.mt
autonomous_camera.mt
risk_monitor.mt
```

---

## Roadmap

- [x] Lexer with indentation tracking
- [x] Recursive-descent parser
- [x] Full AST type system
- [x] TypeScript code generator
- [x] Runtime stubs for all built-ins
- [x] CLI: `manta compile`, `manta run`, `manta tokens`, `manta ast`
- [ ] Real YOLO/TensorFlow.js backend
- [ ] Anthropic SDK integration for `ask`
- [ ] VS Code syntax highlighting extension
- [ ] Type checker pass
- [ ] `manta init` project scaffolding
- [ ] ESP32 serial sensor bridge
- [ ] Manta Ray Studio (Monaco-based IDE)

---

## License

MIT — do whatever you want with it.

---

*Built with a full compiler toolchain. Not a chatbot wrapper.*
