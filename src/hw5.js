import {OrbitControls} from './OrbitControls.js'

// scene setup part!!!!!!!!!!!

// THREE.Scene is the root container that holds every object, light, and camera
const scene = new THREE.Scene();

// PerspectiveCamera(fov, aspect, near, far):
//   fov=75   → 75° vertical field of view — wide enough to feel immersive
//   aspect   → ratio of browser width/height so nothing looks stretched
//   near=0.1 → objects closer than 0.1 units get clipped (not drawn)
//   far=1000 → objects farther than 1000 units get clipped
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// WebGLRenderer draws the scene to a <canvas> element using the GPU
// antialias: true smooths jagged edges on diagonal geometry
const renderer = new THREE.WebGLRenderer({ antialias: true });

// size the canvas to fill the whole browser window on startup
renderer.setSize(window.innerWidth, window.innerHeight);

// respect the screen's pixel density (retina/HiDPI)
// Math.min(..., 2) caps it at 2× so we don't overload mobile GPUs.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// attach the renderer's <canvas> into the HTML <body>
document.body.appendChild(renderer.domElement);

// turn on shadow rendering on the GPU
renderer.shadowMap.enabled = true;

// PCFSoftShadowMap samples a small region around each shadow edge
// instead of a single point — produces soft realistic shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// deep navy background — mimics the dark interior of a bowling alley
scene.background = new THREE.Color(0x1a1a2e);

// resize handler part!!!!!!!!!!!!!!

// fires whenever the browser window is resized
window.addEventListener('resize', () => {
  // recalculate the aspect ratio from the new window dimensions
  camera.aspect = window.innerWidth / window.innerHeight;
  // after changing any camera property I had to call this — it rebuilds
  // the projection matrix that maps 3D space onto the 2D screen
  camera.updateProjectionMatrix();
  // resize the renderer canvas to match the new window size
  renderer.setSize(window.innerWidth, window.innerHeight);
  // re-clamp pixel ratio in case the window moved to a different screen
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// lightning part!!!!!!!!!!!!!!

// ambientLight illuminates all surfaces equally from all directions — no shadows
// has no position, keeps dark-side surfaces from going completely black
// intensity 0.35 is a gentle fill
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

// HemisphereLight(skyColor, groundColor, intensity):
// simulates environmental bounce light — cool bluish from above (ceiling),
// warm tan from below (light bouncing off the wooden lane)
// this fakes global illumination cheaply and makes the scene feel natural
const hemiLight = new THREE.HemisphereLight(0xaaaaff, 0xc8945a, 0.2);
scene.add(hemiLight);

// DirectionalLight shoots parallel rays from one direction — like a long bank
// of fluorescent tube lights running the full length of the alley ceiling
const directionalLight = new THREE.DirectionalLight(0xfff8e7, 1.0);
// position it high above the lane, angled slightly toward the pin end
directionalLight.position.set(0, 25, -20);
directionalLight.castShadow = true;

// shadow map resolution — higher = sharper shadows, more GPU cost
// 2048×2048 is a good quality/performance balance
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

// the shadow camera is an orthographic frustum attached to the light
// left/right/top/bottom are in the LIGHT's local space and must be large
// enough to contain the entire scene we want to receive shadows
// the lane spans z=+15 (approach) to z=-60 (pin deck), so we set the
// frustum to cover that range from the light's vantage point
directionalLight.shadow.camera.near   =  1;
directionalLight.shadow.camera.far    = 110;
directionalLight.shadow.camera.left   = -12;
directionalLight.shadow.camera.right  =  12;
directionalLight.shadow.camera.top    =  55;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

// SpotLight(color, intensity, distance, angle, penumbra, decay):
//   color      → warm yellowish-white, like an overhead halogen lamp
//   intensity  → 1.4 — strong focused beam
//   distance   → 45 — falls off to zero at 45 units
//   angle      → Math.PI/5 — 36° cone
//   penumbra   → 0.4 — soft edge on the spotlight cone
//   decay      → 1 — realistic light falloff with distance
// positioned directly above the pin formation to give them dramatic lighting
const pinLight = new THREE.SpotLight(0xfffde0, 1.4, 45, Math.PI / 5, 0.4, 1);
pinLight.position.set(0, 15, -57);
// the spotlight always aims at its target object. we place the target
// at the center of the pin formation and add it to the scene
pinLight.target.position.set(0, 0, -58);
pinLight.castShadow = true;
pinLight.shadow.mapSize.width  = 1024;
pinLight.shadow.mapSize.height = 1024;
scene.add(pinLight);
scene.add(pinLight.target); // THREE.js requires the target to be in the scene

// utility part!!!!!!!!!!!!!

// THREE.js uses radians for all rotations. this converts degrees → radians
function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

// bowling lane part!!!!!!!!!!!!!!

// builds the static alley base: lane, approach, gutters, pin deck, foul line, walls
function createBowlingLane() {

  // Main lane surface:
  // BoxGeometry(width, height, depth): 3.5 wide × 0.2 tall × 60 deep
  // real lanes are 60 feet long and 3.5 feet wide — units roughly map to feet
  const laneGeometry = new THREE.BoxGeometry(3.5, 0.2, 60);
  const laneMaterial = new THREE.MeshPhongMaterial({
    color: 0xf1c27d,  // warm maple/wood color
    shininess: 110    // high shininess = polished lacquered wood
  });
  const lane = new THREE.Mesh(laneGeometry, laneMaterial);
  // center on X; shift z by -30 so the box spans from z=0 to z=-60
  lane.position.set(0, 0, -30);
  lane.receiveShadow = true; // lane catches shadows from pins and ball
  scene.add(lane);

  // Approach area:
  // where the bowler walks before releasing. slightly wider and darker
  const approachGeometry = new THREE.BoxGeometry(5.2, 0.18, 15);
  const approachMaterial = new THREE.MeshPhongMaterial({
    color: 0xa66f3f, // darker brown , different surface texture than the lane
    shininess: 45
  });
  const approach = new THREE.Mesh(approachGeometry, approachMaterial);
  // z=7.5 → spans from z=0 to z=15
  // y=-0.01 → sits just below lane level so they butt up flush
  approach.position.set(0, -0.01, 7.5);
  approach.receiveShadow = true;
  scene.add(approach);

  // Pin deck:
  // the slightly raised platform at the far end where all 10 pins stand
  const pinDeckGeometry = new THREE.BoxGeometry(4.2, 0.22, 5);
  const pinDeckMaterial = new THREE.MeshPhongMaterial({
    color: 0xb98b5a, // richer wood tone to distinguish it from the lane
    shininess: 70
  });
  const pinDeck = new THREE.Mesh(pinDeckGeometry, pinDeckMaterial);
  // y=0.02 → deck sits just above lane level (a subtle visual lift)
  pinDeck.position.set(0, 0.02, -57.5);
  pinDeck.receiveShadow = true;
  scene.add(pinDeck);

  // Foul line:
  // a bright white stripe stretched across the full approach width at z=0
  // MeshBasicMaterial ignores all lighting , it's always the exact color we set
  const foulLineGeometry = new THREE.BoxGeometry(4.3, 0.04, 0.16);
  const foulLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const foulLine = new THREE.Mesh(foulLineGeometry, foulLineMaterial);
  foulLine.position.set(0, 0.13, 0);
  scene.add(foulLine);

  // Gutters:
  // the channels on either side of the lane that catch errant balls
  // y=-0.08 → lower than the lane surface, forming a slight depression
  const gutterGeometry = new THREE.BoxGeometry(0.55, 0.12, 60);
  const gutterMaterial = new THREE.MeshPhongMaterial({
    color: 0x2a2a2a, // very dark , gutters are typically black rubber/metal
    shininess: 30
  });

  const leftGutter = new THREE.Mesh(gutterGeometry, gutterMaterial);
  leftGutter.position.set(-2.3, -0.08, -30);
  leftGutter.castShadow  = true; // gutters cast shadows onto the lane
  leftGutter.receiveShadow = true;
  scene.add(leftGutter);

  const rightGutter = new THREE.Mesh(gutterGeometry, gutterMaterial);
  rightGutter.position.set(2.3, -0.08, -30);
  rightGutter.castShadow  = true;
  rightGutter.receiveShadow = true;
  scene.add(rightGutter);

  // Side walls:
  // tall panels on both sides that enclose the lane , add vertical depth
  const wallGeometry = new THREE.BoxGeometry(0.15, 2.5, 60);
  const wallMaterial = new THREE.MeshPhongMaterial({
    color: 0x3d2b1a, // dark wood paneling
    shininess: 20
  });

  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.position.set(-2.75, 1.0, -30);
  leftWall.castShadow  = true;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.position.set(2.75, 1.0, -30);
  rightWall.castShadow  = true;
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // Back wall:
  // closes off the far end of the alley behind the pin deck
  const backWallGeometry = new THREE.BoxGeometry(6.5, 3.5, 0.2);
  const backWallMaterial = new THREE.MeshPhongMaterial({
    color: 0x2a1e12,
    shininess: 10
  });
  const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
  backWall.position.set(0, 1.5, -61);
  backWall.receiveShadow = true;
  scene.add(backWall);
}

// lane markings part!!!!!!!!!

// adds wood board lines, approach dots, and targeting arrows
function createLaneMarkings() {

  // Board lines:
  // thin vertical stripes that simulate individual maple boards
  // real lanes have 39 boards, I used a simplified version for visual effect
  const boardLineMaterial = new THREE.MeshBasicMaterial({ color: 0xc8945a });

  // loop from x=-1.5 to x=1.5 in 0.5-unit steps → 7 lines across the lane
  for (let x = -1.5; x <= 1.5; x += 0.5) {
    const boardLineGeometry = new THREE.BoxGeometry(0.025, 0.01, 60);
    const boardLine = new THREE.Mesh(boardLineGeometry, boardLineMaterial);
    // y=0.125 → just above lane surface (lane top is at y=0.1)
    boardLine.position.set(x, 0.125, -30);
    scene.add(boardLine);
  }

  // Approach dots:
  // two rows of 5 small dots in the approach area
  // bowlers align their stance using these before releasing the ball
  const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
  // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
  const dotGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.015, 32);

  const dotRows = [4, 8];                          // z positions on approach area
  const dotXPositions = [-1.2, -0.6, 0, 0.6, 1.2]; // spread evenly across lane width

  for (const z of dotRows) {
    for (const x of dotXPositions) {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      // rotate 90° around X so the flat face of the cylinder faces up
      dot.rotation.x = Math.PI / 2;
      dot.position.set(x, 0.12, z);
      scene.add(dot);
    }
  }

  // Targeting arrows:
  // 7 triangle markers embedded in the lane, 15 units past the foul line
  // bowlers aim at these rather than the pins , theyr closer and easier to track
  const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });

  // THREE.Shape lets us draw a 2D path. moveTo sets the pen, lineTo draws edges
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo( 0,     0.65);  // tip pointing toward the pins
  arrowShape.lineTo(-0.22, -0.25);  // bottom-left corner
  arrowShape.lineTo( 0.22, -0.25);  // bottom-right corner
  arrowShape.lineTo( 0,     0.65);  // back to tip (closes the triangle)

  // ShapeGeometry converts the 2D path into flat 3D mesh geometry
  const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
  const arrowXPositions = [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2];

  for (const x of arrowXPositions) {
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    // rotate -90° on X so the flat shape lies flush on the lane floor
    arrow.rotation.x = -Math.PI / 2;
    // z=-15 → 15 units past the foul line, toward the pins
    arrow.position.set(x, 0.17, -15);
    scene.add(arrow);
  }
}

// bowling pins part!!!!!!!!!!!!

// builds one pin from 5 stacked geometries —,base, body, neck, stripe, head
// the pinGroup lets us position all pieces together by moving one object
function createSinglePin(x, z) {
  // THREE.Group is an invisible container. moving/rotating it affects all children
  const pinGroup = new THREE.Group();

  // glossy white plastic , regulation pin color
  const whiteMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 80
  });

  // bold red for the regulation stripe band
  const redMaterial = new THREE.MeshPhongMaterial({
    color: 0xc40000,
    shininess: 60
  });

  // Flat base:
  // small cylinder so the pin stands stably on the deck without tipping
  const baseGeometry = new THREE.CylinderGeometry(0.19, 0.23, 0.08, 32);
  const base = new THREE.Mesh(baseGeometry, whiteMaterial);
  base.position.set(0, 0.06, 0); // sits at the very bottom of the pin
  base.castShadow   = true;
  base.receiveShadow = true;
  pinGroup.add(base);

  // Wide lower body:
  // a sphere scaled non-uniformly (y=1.6) to stretch it into an oval/belly shape
  // scale.set(x, y, z): y=1.6 makes it 60% taller than wide
  const bodyGeometry = new THREE.SphereGeometry(0.22, 32, 32);
  const body = new THREE.Mesh(bodyGeometry, whiteMaterial);
  body.scale.set(1.0, 1.6, 1.0);
  body.position.set(0, 0.38, 0);
  body.castShadow   = true;
  body.receiveShadow = true;
  pinGroup.add(body);

  // Narrow neck:
  // CylinderGeometry(topRadius, bottomRadius, height, segments)
  // tapers slightly from bottom (0.15) to top (0.11) for the classic pin silhouette
  const neckGeometry = new THREE.CylinderGeometry(0.11, 0.15, 0.55, 32);
  const neck = new THREE.Mesh(neckGeometry, whiteMaterial);
  neck.position.set(0, 0.78, 0);
  neck.castShadow   = true;
  neck.receiveShadow = true;
  pinGroup.add(neck);

  // Red stripe:
  // a thin ring around the upper neck , the regulation "belly band" marking
  const stripeGeometry = new THREE.CylinderGeometry(0.126, 0.142, 0.08, 32);
  const stripe = new THREE.Mesh(stripeGeometry, redMaterial);
  stripe.position.set(0, 1.00, 0); // placed at the junction of neck and head
  stripe.castShadow   = true;
  stripe.receiveShadow = true;
  pinGroup.add(stripe);

  // Rounded head:
  // small sphere at the very top of the pin
  const topGeometry = new THREE.SphereGeometry(0.13, 32, 32);
  const top = new THREE.Mesh(topGeometry, whiteMaterial);
  top.position.set(0, 1.18, 0);
  top.castShadow   = true;
  top.receiveShadow = true;
  pinGroup.add(top);

  // position the whole group so its base rests on the pin deck surface
  // y=0.12 lifts it above the deck (deck top is at y ≈ 0.12)
  pinGroup.position.set(x, 0.12, z);
  scene.add(pinGroup);
}

// places all 10 pins in the standard 1-2-3-4 triangular formation
// rows are spaced 0.866 units apart (equilateral triangle geometry — sin(60°) × 1.0)
function createPins() {
  const pinPositions = [
    // row 1 — head pin (closest to bowler)
    [ 0.0,  -57.000],
    // row 2
    [-0.5,  -57.866],
    [ 0.5,  -57.866],
    // row 3
    [-1.0,  -58.732],
    [ 0.0,  -58.732],
    [ 1.0,  -58.732],
    // row 4 — back row (farthest from bowler)
    [-1.5,  -59.598],
    [-0.5,  -59.598],
    [ 0.5,  -59.598],
    [ 1.5,  -59.598]
  ];

  // Destructure each [x, z] pair and pass it to createSinglePin
  for (const [x, z] of pinPositions) {
    createSinglePin(x, z);
  }
}

// bowling ball part!!!!!!!

// creates a static, glossy pink bowling ball with three finger holes on the approach
function createBowlingBall() {
  const ballRadius = 0.45; // ~0.9 units diameter — correct size relative to the lane

  // high shininess (160) + white specular = glassy resin appearance
  // specular sets the color of shiny highlights (white = bright clear reflections)
  const ballMaterial = new THREE.MeshPhongMaterial({
    color: 0xff4fa3,     // hot pink , our creative personal touch :)
    shininess: 160,
    specular: 0xffffff
  });

  // 64 width + height segments → very smooth sphere with no visible faceting
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);

  // centered on the lane (x=0), on the approach (z=5.5)
  // y = ballRadius + 0.09 lifts the sphere so its bottom touches the approach surface
  ball.position.set(0, ballRadius + 0.09, 5.5);
  ball.castShadow   = true;
  ball.receiveShadow = true;
  scene.add(ball);

  // Finger holes:
  // small dark spheres embedded into the ball surface and squished flat
  // along the Z axis with scale to simulate depth without actual geometry cuts
  const holeMaterial = new THREE.MeshPhongMaterial({
    color: 0x111111,
    shininess: 10 // matte interior contrasts against the glossy ball
  });
  const holeGeometry = new THREE.SphereGeometry(0.07, 32, 32);

  // [x, y, z] positions for the three holes , two finger holes side by side
  // near the top, one thumb hole slightly lower and centered
  const holePositions = [
    [-0.11, ball.position.y + 0.17, ball.position.z + 0.41], // left finger
    [ 0.11, ball.position.y + 0.17, ball.position.z + 0.41], // right finger
    [ 0.00, ball.position.y + 0.02, ball.position.z + 0.43]  // thumb (lower, centered)
  ];

  for (const [x, y, z] of holePositions) {
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    if (y > ball.position.y + 0.10) {
      // finger holes: scale(0.85, 0.85, 0.3) , squish along Z to look like a deep pit
      hole.scale.set(0.85, 0.85, 0.3);
    } else {
      // Thumb hole: slightly larger opening
      hole.scale.set(1.0, 1.0, 0.3);
    }
    hole.position.set(x, y, z);
    scene.add(hole);
  }
}

// bonus part for ball return track!!!!!!!!

// a mechanical ball return trough running alongside the right gutter
// our bonus addition , it adds realism to the alley scene
function createBallReturn() {
  // Trough body:
  // narrow channel running the full lane length, just outside the right wall
  const troughGeometry = new THREE.BoxGeometry(0.4, 0.15, 58);
  const troughMaterial = new THREE.MeshPhongMaterial({
    color: 0x1c1c1c,
    shininess: 60
  });
  const trough = new THREE.Mesh(troughGeometry, troughMaterial);
  trough.position.set(3.35, -0.15, -29);
  trough.castShadow   = true;
  trough.receiveShadow = true;
  scene.add(trough);

  // Metal rails:
  // two thin cylinders inside the trough , the ball rolls along these rails
  const railMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888,
    shininess: 120 // shiny metal finish
  });
  const railGeometry = new THREE.CylinderGeometry(0.03, 0.03, 58, 16);

  // place one rail on each side of the trough center
  for (const xOffset of [-0.1, 0.1]) {
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    // rotate the cylinder 90° on X so it runs along the Z axis (lane length)
    rail.rotation.x = Math.PI / 2;
    rail.position.set(3.35 + xOffset, -0.06, -29);
    rail.castShadow = true;
    scene.add(rail);
  }
}

// bonus part for overhead scoring display!!!!!

// a flat screen mounted above the approach area
function createOverheadDisplay() {
  // Screen bezel:
  const bezelGeometry = new THREE.BoxGeometry(4.3, 1.9, 0.06);
  const bezelMaterial = new THREE.MeshPhongMaterial({
    color: 0x111111,
    shininess: 40
  });
  const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
  bezel.position.set(0, 4.5, -2.04); // behind the screen so the frame peeks out
  scene.add(bezel);

  // Screen face:
  // emissive: 0x003366 adds a self-lit blue glow independent of scene lighting
  // emissiveIntensity: 0.4 keeps the glow subtle — not blinding
  const screenGeometry = new THREE.BoxGeometry(4.0, 1.6, 0.08);
  const screenMaterial = new THREE.MeshPhongMaterial({
    color: 0x001122,
    emissive: 0x003366,
    emissiveIntensity: 0.4,
    shininess: 80
  });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(0, 4.5, -2);
  screen.castShadow = true;
  scene.add(screen);

  // Mount arm:
  // vertical cylinder connecting the screen to the overhead structure
  const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 16);
  const armMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 60 });
  const arm = new THREE.Mesh(armGeometry, armMaterial);
  arm.position.set(0, 5.7, -2);
  scene.add(arm);

  // Screen glow:
  // soft blue-white point light in front of the screen, simulating the screen's glow
  // spilling onto nearby surfaces
  const displayLight = new THREE.PointLight(0x4488ff, 0.3, 8);
  displayLight.position.set(0, 4.5, -1.5);
  scene.add(displayLight);
}

// building rhe scene part!!!!!
createBowlingLane();
createLaneMarkings();
createPins();
createBowlingBall();
createBallReturn();       // bonus
createOverheadDisplay();  // bonus

// camera final position!!!!!

// fefault "full-lane" view: elevated behind the approach, looking down the lane
// shows the ball, foul line, arrows, lane, and pins all in one frame
// Matrix4.makeTranslation(x, y, z) builds a translation matrix
// camera.applyMatrix4(...) multiplies it into the camera's transform
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 9, 12);
camera.applyMatrix4(cameraTranslate);

// orbit controls!!!!!

// OrbitControls wraps the camera and lets the user:
//   Left-drag   → rotate orbit
//   Right-drag  → pan
//   Scroll      → zoom
const controls = new OrbitControls(camera, renderer.domElement);

// the orbit pivot point , the camera rotates around this world-space coordinate
// we aim at the mid-lane so orbiting gives a nice full-scene rotation
controls.target.set(0, 0.5, -25);
controls.update(); // apply the target before the first frame renders

let isOrbitEnabled = true;

// camera presets!!!!!

// four pre planned viewpoints accessible with number keys 1–4
// each preset is { pos: [x,y,z], target: [x,y,z] }
const cameraPresets = [
  // 1 — full lane (default): elevated behind approach, sees the whole alley
  { pos: [0,   9,   12],  target: [0, 0.5, -25] },
  // 2 — pin close-up: low angle facing the pin formation head-on
  { pos: [0,   2,  -50],  target: [0, 0.5, -58] },
  // 3 — ball close-up: low angle right in front of the ball
  { pos: [0,   1.5,  8],  target: [0, 0.5,  5.5] },
  // 4 — side view: from the right wall, looking across the full lane
  { pos: [8,   5,  -30],  target: [0, 0.5, -30] },
];

// moves camera and orbit target to a preset instantly
function applyCameraPreset(index) {
  const preset = cameraPresets[index];
  // spread operator (...) unpacks the array into individual x, y, z arguments
  camera.position.set(...preset.pos);
  controls.target.set(...preset.target);
  // must call update() after manually changing controls.target
  controls.update();
}

// UI framework!!!!!!

// inject shared CSS for all overlay panels into the document <head>
const style = document.createElement('style');
style.textContent = `
  /* Shared panel base style */
  .ui-panel {
    position: absolute;
    background: rgba(10, 10, 30, 0.82);
    color: #e8e8f0;
    font-family: 'Arial', sans-serif;
    font-size: 14px;
    border: 1px solid rgba(100, 130, 200, 0.35);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    /* pointer-events: none means mouse clicks pass through the panel to the canvas */
    pointer-events: none;
  }
  .ui-panel h3 {
    margin: 0 0 8px 0;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #88aaff;
    border-bottom: 1px solid rgba(100, 130, 200, 0.25);
    padding-bottom: 6px;
  }

  /* ── Scorecard ── */
  /* Centered horizontally at the top of the screen */
  #scorecard-container {
    top: 16px;
    left: 50%;
    transform: translateX(-50%); /* shift left by half own width to truly center */
    width: 640px;
  }
  .scorecard-frames {
    display: flex;
    gap: 4px;
  }
  /* One flex cell per bowling frame */
  .frame-cell {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(100, 130, 200, 0.2);
    border-radius: 4px;
    min-height: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 4px 2px;
  }
  /* The 10th frame is wider — it can have 3 deliveries */
  .frame-cell.tenth { flex: 1.4; }
  /* Roll result boxes inside each frame */
  .roll-boxes {
    display: flex;
    gap: 2px;
    margin-bottom: 2px;
  }
  .roll-box {
    width: 18px;
    height: 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(150, 170, 220, 0.3);
    border-radius: 2px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ddeeff;
  }
  /* Frame number label beneath the roll boxes */
  .frame-label {
    font-size: 9px;
    color: #6680cc;
    margin-top: 2px;
  }
  /* Cumulative score area (populated in HW06) */
  .frame-score {
    font-size: 11px;
    color: #aac0ff;
    min-height: 14px;
  }

  /* ── Controls panel ── */
  #controls-container {
    bottom: 20px;
    left: 20px;
    min-width: 230px;
  }
  .control-row {
    display: flex;
    gap: 10px;
    align-items: center;
    margin: 5px 0;
    font-size: 13px;
  }
  /* Keyboard key visual badge */
  .key-badge {
    display: inline-block;
    background: rgba(80, 100, 180, 0.4);
    border: 1px solid rgba(100, 130, 220, 0.5);
    border-radius: 4px;
    padding: 1px 7px;
    font-family: monospace;
    font-size: 12px;
    color: #ccd8ff;
    min-width: 22px;
    text-align: center;
  }
`;
document.head.appendChild(style);

// scorecard container!!!!
// 10 frames, each with 2 roll boxes (3 for the 10th frame)
// values intentionally blank
const scorecardContainer = document.createElement('div');
scorecardContainer.id = 'scorecard-container';
scorecardContainer.className = 'ui-panel';

let framesHTML = '<h3>Scorecard</h3><div class="scorecard-frames">';
for (let f = 1; f <= 10; f++) {
  const isTenth = f === 10;
  // template literals (backtick strings) allow embedded expressions with ${}
  framesHTML += `
    <div class="frame-cell${isTenth ? ' tenth' : ''}">
      <div class="roll-boxes">
        <div class="roll-box"></div>
        <div class="roll-box"></div>
        ${isTenth ? '<div class="roll-box"></div>' : ''}
      </div>
      <div class="frame-score"></div>
      <div class="frame-label">F${f}</div>
    </div>`;
}
framesHTML += '</div>';
scorecardContainer.innerHTML = framesHTML;
document.body.appendChild(scorecardContainer);

// controls panel!!!!!!!!
// lists every keyboard shortcut and mouse interaction
const controlsContainer = document.createElement('div');
controlsContainer.id = 'controls-container';
controlsContainer.className = 'ui-panel';
controlsContainer.innerHTML = `
  <h3>Controls</h3>
  <div class="control-row"><span class="key-badge">O</span> Toggle orbit camera</div>
  <div class="control-row"><span class="key-badge">1</span> Full lane view</div>
  <div class="control-row"><span class="key-badge">2</span> Pin close-up</div>
  <div class="control-row"><span class="key-badge">3</span> Ball close-up</div>
  <div class="control-row"><span class="key-badge">4</span> Side view</div>
  <div class="control-row" style="margin-top:6px; font-size:11px; color:#6680cc;">
    🖱 Drag &nbsp;·&nbsp; Scroll &nbsp;·&nbsp; Right-drag
  </div>
`;
document.body.appendChild(controlsContainer);

// key handler!!!!!!!
function handleKeyDown(e) {
  // 'o' / 'O' → toggle mouse orbit on/off
  if (e.key === 'o' || e.key === 'O') {
    isOrbitEnabled = !isOrbitEnabled;
  }
  // keys '1'–'4' → jump to a camera preset
  if (e.key >= '1' && e.key <= '4') {
    // parseInt converts the key character ('1'→1) then -1 gives 0-based index
    applyCameraPreset(parseInt(e.key) - 1);
  }
}

document.addEventListener('keydown', handleKeyDown);

// animation loop!!!!!!
function animate() {
  // requestAnimationFrame schedules the next call before doing any work —
  // keeps the loop smooth even if a single frame takes longer than expected
  // the browser also pauses this automatically when the tab is hidden (saves CPU)
  requestAnimationFrame(animate);

  // sync OrbitControls , must be called every frame so the camera
  // smoothly follows mouse input and respects the enabled flag
  controls.enabled = isOrbitEnabled;
  controls.update();

  // draw the current frame: projects every object through the camera and
  // rasterizes it into the WebGL canvas
  renderer.render(scene, camera);
}

// start the loop
animate();