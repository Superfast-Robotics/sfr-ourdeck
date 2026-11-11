/* Streaming pitch media. Cover is baked at 6x; demo and trial wall at 4x.
 * Browser playback stays at 1x for efficient hardware decoding.
 * Original evaluation GIFs remain available as the wall fallback. */
window.PITCH_MEDIA = {
  "trials": {
    "src": "assets/trial-wall.mp4",
    "poster": "assets/trial-wall-poster.jpg",
    "title": "18 robot evaluation rollouts, each looping at 4× speed",
    "sourceUrl": "https://superfastrobotics.com/writings/demo-001.html"
  },
  "hero": {
    "src": "assets/rollout-reel-web.mp4",
    "poster": "assets/rollout-reel-poster.jpg",
    "title": "18 Superfast Robotics evaluation rollouts, edited at 6x speed",
    "sourceUrl": "https://superfastrobotics.com/writings/demo-001.html"
  },
  "robot": {
    "src": "assets/robot-ambient.mp4",
    "poster": "assets/robot-ambient-poster.jpg",
    "title": "Superfast Robotics onboard pick-and-place",
    "sourceUrl": "https://superfastrobotics.com/writings/demo-001.html"
  },
  "demo": {
    "src": "assets/demo-001-4x.mp4",
    "poster": "assets/shared/demo-001-poster.jpg",
    "title": "Superfast Robotics Demo 001",
    "sourceUrl": "https://superfastrobotics.com/writings/demo-001.html"
  },
  "dream": {
    "src": "assets/dream-1-reel.mp4?v=20261110-agi",
    "poster": "assets/dream-1-reel-poster.jpg?v=20261110-agi",
    "title": "Dream-1: AgiBot fruit placement, can restocking and fruit pouring",
    "sourceUrl": "https://dreamlabs.ai/research/dream-1/"
  },
  "groot": {
    "src": "assets/groot-2-reel-web.mp4",
    "poster": "assets/groot-2-reel-poster.jpg",
    "title": "GR00T 2: microscope work, shipping labels and popcorn delivery",
    "sourceUrl": "https://research.nvidia.com/labs/gear/gr00t-2/"
  },
  "factory": {
    "src": "assets/factory-web.mp4",
    "poster": "assets/factory-poster.jpg",
    "title": "Figure 03 at BMW Plant Spartanburg",
    "sourceUrl": "https://www.figure.ai/news/f-03-at-bmw"
  }
};

window.PITCH_TRIALS = [
  {
    "src": "assets/shared/rollouts/kitchen-round-tangerine.gif",
    "poster": "assets/shared/rollouts/kitchen-round-tangerine.jpg",
    "label": "Kitchen / Tangerine / Round",
    "alt": "Robot moving a tangerine into a round basket in the kitchen"
  },
  {
    "src": "assets/shared/rollouts/kitchen-round-banana.gif",
    "poster": "assets/shared/rollouts/kitchen-round-banana.jpg",
    "label": "Kitchen / Banana / Round",
    "alt": "Robot moving a banana into a round basket in the kitchen"
  },
  {
    "src": "assets/shared/rollouts/kitchen-round-tomato.gif",
    "poster": "assets/shared/rollouts/kitchen-round-tomato.jpg",
    "label": "Kitchen / Tomato / Round",
    "alt": "Robot moving a tomato into a round basket in the kitchen"
  },
  {
    "src": "assets/shared/rollouts/kitchen-rectangular-tangerine.gif",
    "poster": "assets/shared/rollouts/kitchen-rectangular-tangerine.jpg",
    "label": "Kitchen / Tangerine / Rectangular",
    "alt": "Robot moving a tangerine into a rectangular basket in the kitchen"
  },
  {
    "src": "assets/shared/rollouts/kitchen-rectangular-banana.gif",
    "poster": "assets/shared/rollouts/kitchen-rectangular-banana.jpg",
    "label": "Kitchen / Banana / Rectangular",
    "alt": "Robot moving a banana into a rectangular basket in the kitchen"
  },
  {
    "src": "assets/shared/rollouts/kitchen-rectangular-tomato.gif",
    "poster": "assets/shared/rollouts/kitchen-rectangular-tomato.jpg",
    "label": "Kitchen / Tomato / Rectangular",
    "alt": "Robot moving a tomato into a rectangular basket in the kitchen"
  },
  {
    "src": "assets/shared/rollouts/meeting-room-round-tangerine.gif",
    "poster": "assets/shared/rollouts/meeting-room-round-tangerine.jpg",
    "label": "Meeting Room / Tangerine / Round",
    "alt": "Robot moving a tangerine into a round basket in the meeting room"
  },
  {
    "src": "assets/shared/rollouts/meeting-room-round-banana.gif",
    "poster": "assets/shared/rollouts/meeting-room-round-banana.jpg",
    "label": "Meeting Room / Banana / Round",
    "alt": "Robot moving a banana into a round basket in the meeting room"
  },
  {
    "src": "assets/shared/rollouts/meeting-room-round-tomato.gif",
    "poster": "assets/shared/rollouts/meeting-room-round-tomato.jpg",
    "label": "Meeting Room / Tomato / Round",
    "alt": "Robot moving a tomato into a round basket in the meeting room"
  },
  {
    "src": "assets/shared/rollouts/meeting-room-rectangular-tangerine.gif",
    "poster": "assets/shared/rollouts/meeting-room-rectangular-tangerine.jpg",
    "label": "Meeting Room / Tangerine / Rectangular",
    "alt": "Robot moving a tangerine into a rectangular basket in the meeting room"
  },
  {
    "src": "assets/shared/rollouts/meeting-room-rectangular-banana.gif",
    "poster": "assets/shared/rollouts/meeting-room-rectangular-banana.jpg",
    "label": "Meeting Room / Banana / Rectangular",
    "alt": "Robot moving a banana into a rectangular basket in the meeting room"
  },
  {
    "src": "assets/shared/rollouts/meeting-room-rectangular-tomato.gif",
    "poster": "assets/shared/rollouts/meeting-room-rectangular-tomato.jpg",
    "label": "Meeting Room / Tomato / Rectangular",
    "alt": "Robot moving a tomato into a rectangular basket in the meeting room"
  },
  {
    "src": "assets/shared/rollouts/warehouse-round-tangerine.gif",
    "poster": "assets/shared/rollouts/warehouse-round-tangerine.jpg",
    "label": "Warehouse / Tangerine / Round",
    "alt": "Robot moving a tangerine into a round basket in the warehouse"
  },
  {
    "src": "assets/shared/rollouts/warehouse-round-banana.gif",
    "poster": "assets/shared/rollouts/warehouse-round-banana.jpg",
    "label": "Warehouse / Banana / Round",
    "alt": "Robot moving a banana into a round basket in the warehouse"
  },
  {
    "src": "assets/shared/rollouts/warehouse-round-tomato.gif",
    "poster": "assets/shared/rollouts/warehouse-round-tomato.jpg",
    "label": "Warehouse / Tomato / Round",
    "alt": "Robot moving a tomato into a round basket in the warehouse"
  },
  {
    "src": "assets/shared/rollouts/warehouse-rectangular-tangerine.gif",
    "poster": "assets/shared/rollouts/warehouse-rectangular-tangerine.jpg",
    "label": "Warehouse / Tangerine / Rectangular",
    "alt": "Robot moving a tangerine into a rectangular basket in the warehouse"
  },
  {
    "src": "assets/shared/rollouts/warehouse-rectangular-banana.gif",
    "poster": "assets/shared/rollouts/warehouse-rectangular-banana.jpg",
    "label": "Warehouse / Banana / Rectangular",
    "alt": "Robot moving a banana into a rectangular basket in the warehouse"
  },
  {
    "src": "assets/shared/rollouts/warehouse-rectangular-tomato.gif",
    "poster": "assets/shared/rollouts/warehouse-rectangular-tomato.jpg",
    "label": "Warehouse / Tomato / Rectangular",
    "alt": "Robot moving a tomato into a rectangular basket in the warehouse"
  }
];
