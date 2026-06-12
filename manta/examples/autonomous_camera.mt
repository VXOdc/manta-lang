# autonomous_camera.mt — Full autonomous surveillance loop

camera.start

detect person
detect car
detect bicycle

if detected:
    track person
    predict trajectory

    if collision_risk > 0.8:
        speak "Danger, collision risk detected"
        alert "High collision risk"

    if collision_risk > 0.5:
        speak "Warning, monitor the situation"

ask "Summarize what you see in this scene"
