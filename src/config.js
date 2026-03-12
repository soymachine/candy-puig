// Game design resolution (portrait mobile)
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// Grid configuration
export const GRID_ROWS = 6;
export const GRID_COLS = 6;
export const MIN_COLS = 6;
export const MIN_CELL_SIZE = 60;
export const NUM_GEM_TYPES = 5;

// Board positioning (in design coordinates)
export const BOARD_PADDING = 20;
export const BOARD_TOP_OFFSET = 440; // Space for header + product section

// Layout heights
export const HEADER_HEIGHT = 80;
export const PRODUCT_SECTION_HEIGHT = 380;
export const BOTTOM_BAR_HEIGHT = 140;

// Animation speeds (ms)
export const SWAP_SPEED = 200;
export const FALL_SPEED = 80; // Per row
export const DESTROY_SPEED = 200;
export const CASCADE_DELAY = 100;
export const COLUMN_STAGGER = 50;

// Gameplay
export const GAME_DURATION = 120; // seconds (2 minutes)
export const SWIPE_THRESHOLD = 20;
export const FILL_PER_SCORING_GEM = 3; // Each scoring gem adds 3% fill
export const SCORING_TILE_INDICES = [0, 3, 4]; // tile_1, tile_4, tile_5

// Ingredient names for bottom bar
export const INGREDIENT_NAMES = {
  0: 'JASMINE\nSAMBAC',
  3: 'TUBEROSE',
  4: 'TONKA\nBEAN',
};

// Colors — light elegant theme
export const BG_COLOR = '#f5f0eb';
export const BOARD_BG_COLOR = 0xe8e0d8;
export const CELL_BG_COLOR = 0xf0ebe5;
export const TEXT_COLOR = '#2c2c2c';
export const ACCENT_COLOR = '#c8964e'; // Gold
export const HIGHLIGHT_COLOR = 0xc8964e;

// Progress bar colors
export const PROGRESS_BAR_BG = 0xd9d0c7;
export const PROGRESS_BAR_FILL = 0xc8964e;

// Timer
export const TIMER_PILL_BG = 0x2c2c2c;
export const TIMER_TEXT_COLOR = '#ffffff';

// Gem asset keys
export const GEM_KEYS = [
  'tile_1', 'tile_2', 'tile_3', 'tile_4', 'tile_5'
];
