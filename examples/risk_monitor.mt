# risk_monitor.mt — ESP32 + camera risk monitoring

sensor esp32.connect

camera.start

detect person
detect vehicle

when person.distance < 2m:
    alert "Collision Risk"
    speak "Warning, object too close"
    track person
    predict trajectory

log "Risk monitoring active"
