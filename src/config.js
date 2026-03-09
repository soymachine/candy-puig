// Game design resolution (portrait mobile)
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// Grid configuration
export const GRID_ROWS = 8;
export const GRID_COLS = 8;
export const MIN_COLS = 7; // Reduce columns if cells are too small
export const MIN_CELL_SIZE = 60; // Minimum pixel size before reducing columns
export const NUM_GEM_TYPES = 6;

// Board positioning (in design coordinates)
export const BOARD_PADDING = 20;
export const BOARD_TOP_OFFSET = 300; // Space for score/moves UI at top

// Animation speeds (ms)
export const SWAP_SPEED = 200;
export const FALL_SPEED = 80; // Per row
export const DESTROY_SPEED = 200;
export const CASCADE_DELAY = 100;

// Gameplay
export const TOTAL_MOVES = 30;
export const SWIPE_THRESHOLD = 20;
export const POINTS_PER_GEM = 10;
export const BONUS_PER_EXTRA = 15; // Bonus points for matches > 3
export const CASCADE_MULTIPLIER = 0.5; // Extra multiplier per cascade level

// Colors
export const BG_COLOR = '#1a0a2e';
export const BOARD_BG_COLOR = 0x2d1b4e;
export const TEXT_COLOR = '#ffffff';
export const ACCENT_COLOR = '#ff6b9d';
export const HIGHLIGHT_COLOR = 0xffff00;

// Gem asset keys
export const GEM_KEYS = [
  'gem_0', 'gem_1', 'gem_2', 'gem_3', 'gem_4', 'gem_5'
];
