# Computer Graphics - Exercise 5 - WebGL Bowling Alley

Group Members:
  Tayra Polikar
  Livia Wyler

How to Run:

  1. Clone the repository to your local machine
  2. Make sure Node.js is installed (node -v to check)
  3. Start the local web server:
      bash   node index.js

  4. Open your browser and go to: http://localhost:8000

Controls:

  Key / Mouse  Action
  
  O            Toggle orbit camera on/off
  
  1            Full lane view (default)
  
  2            Pin close-up
  
  3            Ball close-up
  
  4            Side view
  
  Left-drag    Orbit / rotate camera
  
  Scroll        Zoom in/out
  
  Right-drag    Pan camera

Features Implemented

  Core requirements:
  
    1. Full bowling lane (60 × 3.5 units) with maple wood coloring and glossy finish
    
    2. Approach area (15 units, distinct color/shade from lane)
    
    3. Foul line (white stripe across full width at z=0)
    
    4. Lane board lines (simplified wood plank texture)
    
    5. Approach dots (two rows of 5 dots)
    
    6. Targeting arrows (7 triangle markers at 15 units past foul line)
    
    7. Gutters on both sides (slightly lower than lane surface, full length)
    
    8. Pin deck at far end (distinct raised surface)
    
    9. 10 bowling pins in regulation 1-2-3-4 triangular formation
    
        a. Each pin: flat base, wide body, tapered neck, red stripe, rounded head
        b. Cast and receive shadows
        
    10. Static bowling ball (pink, glossy, radius 0.45, finger holes visible)
    
    11. Camera orbit controls (toggled with O key)
    
    12. Responsive resize handler (scene stays correct when browser resizes)
    
    13. Layered lighting: ambient + hemisphere + directional + pin spotlight
    
    14. Soft shadow maps (PCFSoftShadowMap)
    
    15. UI framework:
        Scorecard panel (10 frames, 2 roll boxes each, 3 for the 10th) 
        Controls panel (all key bindings listed on screen)
      
Bonus features:
  1. Ball return track (trough + metal rails alongside right gutter)
  2. Overhead scoring display screen (above approach area, blue-glow emissive)
  3. 4 camera preset positions (keys 1–4)
  4. Side walls and back wall enclosing the lane


Known Issues / Limitations:
  1. Finger holes are simulated with flattened spheres, not actual geometry cuts into the ball
  2. Board lines are simple flat strips — no real texture mapping
  3. The scorecard UI is a static placeholder; scoring logic is deferred to HW06
  4. Physics, ball rolling, pin collision, and interactive aiming are not implemented (reserved for HW06)
  5. Screenshots were taken manually after running the scene in the browser

Sources & Assets:
  1. Three.js r128 — 3D rendering library (CDN)
  2. Three.js OrbitControls — camera interaction (vendored locally as OrbitControls.js)
  3. Three.js Documentation — geometry, material, and lighting reference
  4. Discover Three.js — shadow setup reference
  5. Bowling lane and pin dimensions based on USBC specifications
  6. No external image textures used — all materials are procedural (color + shininess)
