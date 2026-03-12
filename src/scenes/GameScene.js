import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT,
  GRID_ROWS, GRID_COLS, MIN_COLS, MIN_CELL_SIZE, NUM_GEM_TYPES,
  BOARD_PADDING, BOARD_TOP_OFFSET,
  HEADER_HEIGHT, PRODUCT_SECTION_HEIGHT, BOTTOM_BAR_HEIGHT,
  SWAP_SPEED, FALL_SPEED, DESTROY_SPEED, CASCADE_DELAY, COLUMN_STAGGER,
  GAME_DURATION, SWIPE_THRESHOLD,
  FILL_PER_SCORING_GEM, SCORING_TILE_INDICES, INGREDIENT_NAMES,
  BG_COLOR, BOARD_BG_COLOR, CELL_BG_COLOR, TEXT_COLOR, ACCENT_COLOR,
  HIGHLIGHT_COLOR, PROGRESS_BAR_BG, PROGRESS_BAR_FILL,
  TIMER_PILL_BG, TIMER_TEXT_COLOR,
  GEM_KEYS,
} from '../config.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.fillPercent = 0;
    this.timeRemaining = GAME_DURATION;
    this.isPaused = false;
    this.gameWon = false;
    this.cascadeLevel = 0;
    this.canMove = false;
    this.selectedGem = null;
    this.grid = [];
    this.gemSprites = [];
    this.pool = [];

    // Calculate adaptive grid size
    const availableWidth = GAME_WIDTH - BOARD_PADDING * 2;
    this.cols = GRID_COLS;
    this.rows = GRID_ROWS;
    this.cellSize = Math.floor(availableWidth / this.cols);

    if (this.cellSize < MIN_CELL_SIZE) {
      this.cols = MIN_COLS;
      this.cellSize = Math.floor(availableWidth / this.cols);
    }

    this.boardWidth = this.cols * this.cellSize;
    this.boardHeight = this.rows * this.cellSize;
    this.boardX = (GAME_WIDTH - this.boardWidth) / 2;
    this.boardY = BOARD_TOP_OFFSET;

    this.gemDisplaySize = this.cellSize - 8;
  }

  create() {
    this.createBackground();
    this.createHeader();
    this.createProductSection();
    this.createUI();
    this.createBottomBar();
    this.createBoard();
    this.fillBoard();
    this.removeInitialMatches();
    this.createInputHandlers();
    this.startTimer();
    this.canMove = true;
  }

  // ─── RENDERING ──────────────────────────────────────────

  createBackground() {
    // Light warm background
    const bg = this.add.graphics();
    // Subtle gradient from warm white to slightly warmer
    const strips = 20;
    const stripH = GAME_HEIGHT / strips;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const r = Phaser.Math.Interpolation.Linear([0xf8, 0xf0], t);
      const g = Phaser.Math.Interpolation.Linear([0xf4, 0xea], t);
      const b = Phaser.Math.Interpolation.Linear([0xef, 0xe2], t);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * stripH, GAME_WIDTH, stripH + 1);
    }
  }

  createHeader() {
    const headerY = 36;

    // "FRAGRANCE CRUSH" title — black, left-aligned
    this.add.text(40, headerY, 'FRAGRANCE CRUSH', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#1a1a1a',
    }).setOrigin(0, 0);

    // ─── Timer pill (outlined, not filled) ───
    const timerPillW = 120;
    const timerPillH = 40;
    const timerPillX = GAME_WIDTH - 40 - 50 - timerPillW; // leave room for pause
    const timerPillY = headerY + 2;

    this.timerBg = this.add.graphics();
    this._timerPillX = timerPillX;
    this._timerPillY = timerPillY;
    this._timerPillW = timerPillW;
    this._timerPillH = timerPillH;
    this.drawTimerPill(false);

    // Clock icon
    this.timerIcon = this.add.text(timerPillX + 16, timerPillY + timerPillH / 2, '🕐', {
      fontFamily: 'Arial',
      fontSize: '18px',
    }).setOrigin(0, 0.5);

    // Timer text — format "02:00", black by default, red when < 45s
    this.timerText = this.add.text(timerPillX + timerPillW / 2 + 8, timerPillY + timerPillH / 2, '02:00', {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#1a1a1a',
    }).setOrigin(0.5);

    // ─── Pause button (separate pill to the right) ───
    const pausePillW = 46;
    const pausePillH = timerPillH;
    const pausePillX = timerPillX + timerPillW + 10;
    const pausePillY = timerPillY;

    const pauseBtn = this.add.graphics();
    pauseBtn.lineStyle(2, 0xbbbbbb, 1);
    pauseBtn.strokeRoundedRect(pausePillX, pausePillY, pausePillW, pausePillH, pausePillH / 2);
    pauseBtn.fillStyle(0xf5f5f5, 0.5);
    pauseBtn.fillRoundedRect(pausePillX, pausePillY, pausePillW, pausePillH, pausePillH / 2);

    this.pauseIcon = this.add.text(
      pausePillX + pausePillW / 2,
      pausePillY + pausePillH / 2,
      '⏸', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#555555',
      }
    ).setOrigin(0.5);

    const pauseZone = this.add.zone(
      pausePillX + pausePillW / 2,
      pausePillY + pausePillH / 2,
      pausePillW + 10, pausePillH + 10
    ).setInteractive();
    pauseZone.on('pointerdown', () => this.togglePause());
  }

  drawTimerPill(isRed) {
    this.timerBg.clear();
    const { _timerPillX: x, _timerPillY: y, _timerPillW: w, _timerPillH: h } = this;
    const borderColor = isRed ? 0xcc3333 : 0xbbbbbb;
    this.timerBg.lineStyle(2, borderColor, 1);
    this.timerBg.strokeRoundedRect(x, y, w, h, h / 2);
    if (!isRed) {
      this.timerBg.fillStyle(0xf5f5f5, 0.3);
      this.timerBg.fillRoundedRect(x, y, w, h, h / 2);
    }
    // Red underline accent below time text when in red state
    if (isRed) {
      this.timerBg.fillStyle(0xcc3333, 1);
      this.timerBg.fillRect(x + w / 2 - 18 + 8, y + h / 2 + 12, 36, 2);
    }
  }

  createProductSection() {
    const sectionY = HEADER_HEIGHT + 10;

    // ─── Perfume bottle image (left side) ───
    // fragance_image.jpeg is 274x440, we want it ~260px tall
    const bottleTargetH = 260;
    const bottleScale = bottleTargetH / 440;
    const bottleImg = this.add.image(30, sectionY, 'fragance_image');
    bottleImg.setOrigin(0, 0);
    bottleImg.setScale(bottleScale);
    const bottleW = 274 * bottleScale; // ~162px

    // Mask to crop artifacts from image edges (top-right red artifact)
    const bottleMaskG = this.add.graphics();
    bottleMaskG.fillStyle(0xffffff);
    bottleMaskG.fillRoundedRect(28, sectionY + 8, bottleW - 14, bottleTargetH - 12, 6);
    bottleMaskG.setVisible(false);
    bottleImg.setMask(bottleMaskG.createGeometryMask());

    // ─── Right column: GOOD GIRL logo + subtitle + bar ───
    const rightX = bottleW + 45; // start of right column
    const rightW = GAME_WIDTH - rightX - 30; // available width
    const rightCenterX = rightX + rightW / 2;

    // "GOOD GIRL" logo image (576x190)
    const ggTargetW = rightW * 0.85;
    const ggScale = ggTargetW / 576;
    const goodGirlImg = this.add.image(rightCenterX, sectionY + 30, 'good_girl');
    goodGirlImg.setOrigin(0.5, 0);
    goodGirlImg.setScale(ggScale);
    const ggH = 190 * ggScale;

    // ─── Styled progress bar ───
    const barWidth = rightW - 10;
    const barHeight = 24;
    const barX = rightX + 5;
    const barY = sectionY + 30 + ggH + 16;

    // Bar shadow
    const barShadow = this.add.graphics();
    barShadow.fillStyle(0x000000, 0.08);
    barShadow.fillRoundedRect(barX + 1, barY + 2, barWidth, barHeight, barHeight / 2);

    // Bar background (light grey fill)
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0xe5e0da, 1);
    this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, barHeight / 2);

    // White border with subtle shadow
    this.progressBarBg.lineStyle(2, 0xffffff, 0.9);
    this.progressBarBg.strokeRoundedRect(barX, barY, barWidth, barHeight, barHeight / 2);

    // Bar fill (gold gradient)
    this.progressBarFill = this.add.graphics();
    this.progressBarWidth = barWidth;
    this.progressBarHeight = barHeight;
    this.progressBarX = barX;
    this.progressBarY = barY;

    // Rounded mask for fill
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(barX + 2, barY + 2, barWidth - 4, barHeight - 4, (barHeight - 4) / 2);
    this.progressBarMask = maskShape.createGeometryMask();
    this.progressBarFill.setMask(this.progressBarMask);

    // ─── Tick marks below the bar ───
    const tickGraphics = this.add.graphics();
    const numTicks = 20;
    const tickSpacing = (barWidth - 20) / (numTicks - 1);
    for (let i = 0; i < numTicks; i++) {
      const tx = barX + 10 + i * tickSpacing;
      const isMajor = i % 5 === 0;
      const tickH = isMajor ? 8 : 5;
      tickGraphics.fillStyle(0xc8964e, isMajor ? 0.6 : 0.3);
      tickGraphics.fillRect(tx - 0.5, barY + barHeight + 3, 1, tickH);
    }

    // ─── Percentage text — black, bold, positioned ABOVE the bar right end ───
    this.percentText = this.add.text(barX + barWidth, barY - 8, '0%', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#1a1a1a',
    }).setOrigin(1, 1);

    this.updateFillBar();
  }

  createUI() {
    // Board background
    const boardBg = this.add.graphics();
    boardBg.fillStyle(BOARD_BG_COLOR, 0.4);
    boardBg.fillRoundedRect(
      this.boardX - 10,
      this.boardY - 10,
      this.boardWidth + 20,
      this.boardHeight + 20,
      16
    );

    // Per-cell rounded backgrounds
    const cellBgs = this.add.graphics();
    const cellPad = 3;
    const cellR = 8;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cx = this.boardX + c * this.cellSize + cellPad;
        const cy = this.boardY + r * this.cellSize + cellPad;
        const cw = this.cellSize - cellPad * 2;
        cellBgs.fillStyle(CELL_BG_COLOR, 0.6);
        cellBgs.fillRoundedRect(cx, cy, cw, cw, cellR);
      }
    }

    // Board mask
    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(
      this.boardX - 10,
      this.boardY - 10,
      this.boardWidth + 20,
      this.boardHeight + 20
    );
    maskShape.setVisible(false);
    this.boardMask = new Phaser.Display.Masks.GeometryMask(this, maskShape);

    // Selection highlight
    this.selectionHighlight = this.add.graphics();
    this.selectionHighlight.setDepth(1);
  }

  createBottomBar() {
    const barY = this.boardY + this.boardHeight + 20;
    const centerX = GAME_WIDTH / 2;
    const spacing = 180;

    // Background strip
    const barBg = this.add.graphics();
    barBg.fillStyle(0xe8e0d8, 0.5);
    barBg.fillRoundedRect(30, barY, GAME_WIDTH - 60, BOTTOM_BAR_HEIGHT - 20, 16);

    // Show the 3 scoring ingredients
    const scoringIndices = SCORING_TILE_INDICES;
    const startX = centerX - (scoringIndices.length - 1) * spacing / 2;

    scoringIndices.forEach((tileIndex, i) => {
      const x = startX + i * spacing;
      const y = barY + 25;

      // Small tile image
      const tileKey = GEM_KEYS[tileIndex];
      const tile = this.add.image(x, y, tileKey);
      tile.setScale(0.6);

      // Ingredient name label
      const name = INGREDIENT_NAMES[tileIndex] || '';
      this.add.text(x, y + 40, name, {
        fontFamily: 'Arial',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#888888',
        align: 'center',
        lineSpacing: 2,
      }).setOrigin(0.5, 0);
    });
  }

  // ─── TIMER ──────────────────────────────────────────────

  startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });
  }

  onTimerTick() {
    if (this.isPaused || this.gameWon) return;

    this.timeRemaining--;
    this.updateTimerDisplay();

    if (this.timeRemaining <= 0) {
      this.timerEvent.remove();
      this.gameOver(false);
    }
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = this.timeRemaining % 60;
    this.timerText.setText(
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    );

    // Red text and border when below 45 seconds
    const isRed = this.timeRemaining < 45;
    this.timerText.setColor(isRed ? '#cc3333' : '#1a1a1a');
    this.drawTimerPill(isRed);
  }

  // ─── PAUSE ──────────────────────────────────────────────

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.canMove = false;
      this.pauseIcon.setText('▶');

      // Pause overlay
      this.pauseOverlay = this.add.graphics();
      this.pauseOverlay.fillStyle(0x000000, 0.5);
      this.pauseOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.pauseOverlay.setDepth(50);

      this.pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED', {
        fontFamily: 'Georgia, serif',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(51);

      this.pauseResumeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Tap to resume', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#cccccc',
      }).setOrigin(0.5).setDepth(51);

      // Tap overlay to resume
      this.pauseOverlay.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
        Phaser.Geom.Rectangle.Contains
      );
      this.pauseOverlay.on('pointerdown', () => this.togglePause());
    } else {
      this.canMove = true;
      this.pauseIcon.setText('⏸');

      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = null;
      }
      if (this.pauseText) {
        this.pauseText.destroy();
        this.pauseText = null;
      }
      if (this.pauseResumeText) {
        this.pauseResumeText.destroy();
        this.pauseResumeText = null;
      }
    }
  }

  // ─── FILL BAR ───────────────────────────────────────────

  updateFillBar() {
    this.progressBarFill.clear();
    const fill = Math.min(this.fillPercent, 100) / 100;
    const px = this.progressBarX + 2;
    const py = this.progressBarY + 2;
    const maxW = this.progressBarWidth - 4;
    const h = this.progressBarHeight - 4;

    if (fill > 0) {
      const w = maxW * fill;

      // Base gold fill
      this.progressBarFill.fillStyle(0xc8964e, 1);
      this.progressBarFill.fillRect(px, py, w, h);

      // Lighter gold gradient (top half)
      this.progressBarFill.fillStyle(0xd4a85e, 1);
      this.progressBarFill.fillRect(px, py, w, h * 0.45);

      // Bright highlight strip at top
      this.progressBarFill.fillStyle(0xe8c878, 0.7);
      this.progressBarFill.fillRect(px, py, w, h * 0.2);

      // Diagonal shine stripes across the fill
      const stripeW = 8;
      const stripeGap = 14;
      for (let sx = 0; sx < w; sx += stripeGap) {
        this.progressBarFill.fillStyle(0xffffff, 0.12);
        // Draw diagonal parallelogram using a thin strip
        this.progressBarFill.fillRect(px + sx, py, stripeW, h);
      }

      // Top glossy highlight
      this.progressBarFill.fillStyle(0xffffff, 0.25);
      this.progressBarFill.fillRect(px, py, w, h * 0.3);

      // Bottom edge (slightly darker for depth)
      this.progressBarFill.fillStyle(0x000000, 0.1);
      this.progressBarFill.fillRect(px, py + h * 0.85, w, h * 0.15);
    }

    this.percentText.setText(`${Math.round(this.fillPercent)}%`);
  }

  addFill(scoringGemCount) {
    const amount = scoringGemCount * FILL_PER_SCORING_GEM;
    this.fillPercent = Math.min(this.fillPercent + amount, 100);
    this.updateFillBar();

    // Check win
    if (this.fillPercent >= 100 && !this.gameWon) {
      this.gameWon = true;
      this.timerEvent.remove();
      this.time.delayedCall(500, () => {
        this.gameOver(true);
      });
    }
  }

  // ─── BOARD SETUP ────────────────────────────────────────

  createBoard() {
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      this.gemSprites[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = -1;
        this.gemSprites[r][c] = null;
      }
    }
  }

  fillBoard() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const type = Phaser.Math.Between(0, NUM_GEM_TYPES - 1);
        this.grid[r][c] = type;
        this.createGemSprite(r, c, type);
      }
    }
  }

  createGemSprite(row, col, type) {
    const { x, y } = this.gemPosition(row, col);
    let sprite;

    if (this.pool.length > 0) {
      sprite = this.pool.pop();
      sprite.setTexture(GEM_KEYS[type]);
      sprite.setPosition(x, y);
      sprite.setVisible(true);
      sprite.setActive(true);
      sprite.setAlpha(1);
      sprite.setScale(this.gemDisplaySize / 100);
    } else {
      sprite = this.add.image(x, y, GEM_KEYS[type]);
      sprite.setScale(this.gemDisplaySize / 100);
    }

    sprite.setDepth(2);
    sprite.setData('row', row);
    sprite.setData('col', col);
    sprite.setData('type', type);
    sprite.setInteractive();
    sprite.setMask(this.boardMask);

    this.gemSprites[row][col] = sprite;
    return sprite;
  }

  gemPosition(row, col) {
    return {
      x: this.boardX + col * this.cellSize + this.cellSize / 2,
      y: this.boardY + row * this.cellSize + this.cellSize / 2,
    };
  }

  // ─── INITIAL MATCH REMOVAL ──────────────────────────────

  removeInitialMatches() {
    let hasMatches = true;
    let iterations = 0;
    const maxIterations = 100;

    while (hasMatches && iterations < maxIterations) {
      hasMatches = false;
      iterations++;

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (c >= 2 &&
            this.grid[r][c] === this.grid[r][c - 1] &&
            this.grid[r][c] === this.grid[r][c - 2]) {
            this.grid[r][c] = this.getNewType(r, c);
            this.gemSprites[r][c].setTexture(GEM_KEYS[this.grid[r][c]]);
            this.gemSprites[r][c].setData('type', this.grid[r][c]);
            hasMatches = true;
          }
          if (r >= 2 &&
            this.grid[r][c] === this.grid[r - 1][c] &&
            this.grid[r][c] === this.grid[r - 2][c]) {
            this.grid[r][c] = this.getNewType(r, c);
            this.gemSprites[r][c].setTexture(GEM_KEYS[this.grid[r][c]]);
            this.gemSprites[r][c].setData('type', this.grid[r][c]);
            hasMatches = true;
          }
        }
      }
    }
  }

  getNewType(row, col) {
    const avoid = new Set();
    if (col >= 2 && this.grid[row][col - 1] === this.grid[row][col - 2]) {
      avoid.add(this.grid[row][col - 1]);
    }
    if (row >= 2 && this.grid[row - 1][col] === this.grid[row - 2][col]) {
      avoid.add(this.grid[row - 1][col]);
    }
    const available = [];
    for (let t = 0; t < NUM_GEM_TYPES; t++) {
      if (!avoid.has(t)) available.push(t);
    }
    return Phaser.Utils.Array.GetRandom(available);
  }

  // ─── INPUT HANDLING ─────────────────────────────────────

  createInputHandlers() {
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (!this.canMove || this.isPaused) return;

      const row = gameObject.getData('row');
      const col = gameObject.getData('col');

      if (this.selectedGem === null) {
        this.selectGem(row, col, gameObject);
      } else {
        const selRow = this.selectedGem.getData('row');
        const selCol = this.selectedGem.getData('col');

        if (row === selRow && col === selCol) {
          this.deselectGem();
        } else if (this.areAdjacent(selRow, selCol, row, col)) {
          this.deselectGem();
          this.trySwap(selRow, selCol, row, col);
        } else {
          this.deselectGem();
          this.selectGem(row, col, gameObject);
        }
      }
    });

    let startPointer = null;
    let startGem = null;

    this.input.on('gameobjectdown', (pointer, gameObject) => {
      startPointer = { x: pointer.x, y: pointer.y };
      startGem = gameObject;
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.canMove || this.isPaused || !startPointer || !startGem) return;

      const dx = pointer.x - startPointer.x;
      const dy = pointer.y - startPointer.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > SWIPE_THRESHOLD) {
        const row = startGem.getData('row');
        const col = startGem.getData('col');
        let targetRow = row;
        let targetCol = col;

        if (absDx > absDy) {
          targetCol += dx > 0 ? 1 : -1;
        } else {
          targetRow += dy > 0 ? 1 : -1;
        }

        if (targetRow >= 0 && targetRow < this.rows &&
          targetCol >= 0 && targetCol < this.cols) {
          this.deselectGem();
          this.trySwap(row, col, targetRow, targetCol);
        }
      }

      startPointer = null;
      startGem = null;
    });
  }

  selectGem(row, col, sprite) {
    this.selectedGem = sprite;
    this.sound.play('select', { volume: 0.3 });

    this.selectionHighlight.clear();
    this.selectionHighlight.lineStyle(4, HIGHLIGHT_COLOR, 1);
    const { x, y } = this.gemPosition(row, col);
    this.selectionHighlight.strokeRoundedRect(
      x - this.cellSize / 2 + 2,
      y - this.cellSize / 2 + 2,
      this.cellSize - 4,
      this.cellSize - 4,
      8
    );

    this.tweens.add({
      targets: sprite,
      scaleX: (this.gemDisplaySize / 100) * 1.15,
      scaleY: (this.gemDisplaySize / 100) * 1.15,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  deselectGem() {
    if (this.selectedGem) {
      this.tweens.killTweensOf(this.selectedGem);
      this.selectedGem.setScale(this.gemDisplaySize / 100);
      this.selectedGem = null;
    }
    this.selectionHighlight.clear();
  }

  areAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
  }

  // ─── SWAP LOGIC ─────────────────────────────────────────

  trySwap(r1, c1, r2, c2) {
    this.canMove = false;
    this.sound.play('swap', { volume: 0.3 });

    [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];

    const sprite1 = this.gemSprites[r1][c1];
    const sprite2 = this.gemSprites[r2][c2];

    [this.gemSprites[r1][c1], this.gemSprites[r2][c2]] = [this.gemSprites[r2][c2], this.gemSprites[r1][c1]];

    sprite1.setData('row', r2);
    sprite1.setData('col', c2);
    sprite2.setData('row', r1);
    sprite2.setData('col', c1);

    const pos1 = this.gemPosition(r1, c1);
    const pos2 = this.gemPosition(r2, c2);

    this.tweens.add({
      targets: sprite1,
      x: pos2.x,
      y: pos2.y,
      duration: SWAP_SPEED,
      ease: 'Quad.easeInOut',
    });

    this.tweens.add({
      targets: sprite2,
      x: pos1.x,
      y: pos1.y,
      duration: SWAP_SPEED,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        const matches = this.findMatches();
        if (matches.length > 0) {
          this.cascadeLevel = 0;
          this.processMatches(matches);
        } else {
          this.sound.play('no-match', { volume: 0.3 });
          this.swapBack(r1, c1, r2, c2, sprite1, sprite2);
        }
      },
    });
  }

  swapBack(r1, c1, r2, c2, sprite1, sprite2) {
    [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];
    [this.gemSprites[r1][c1], this.gemSprites[r2][c2]] = [this.gemSprites[r2][c2], this.gemSprites[r1][c1]];

    sprite1.setData('row', r1);
    sprite1.setData('col', c1);
    sprite2.setData('row', r2);
    sprite2.setData('col', c2);

    const pos1 = this.gemPosition(r1, c1);
    const pos2 = this.gemPosition(r2, c2);

    this.tweens.add({
      targets: sprite1,
      x: pos1.x,
      y: pos1.y,
      duration: SWAP_SPEED,
      ease: 'Quad.easeInOut',
    });

    this.tweens.add({
      targets: sprite2,
      x: pos2.x,
      y: pos2.y,
      duration: SWAP_SPEED,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.canMove = true;
      },
    });
  }

  // ─── MATCH DETECTION ────────────────────────────────────

  findMatches() {
    const matched = new Set();

    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      let matchLen = 1;
      for (let c = 1; c < this.cols; c++) {
        if (this.grid[r][c] === this.grid[r][c - 1] && this.grid[r][c] !== -1) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            for (let k = 0; k < matchLen; k++) {
              matched.add(`${r},${c - 1 - k}`);
            }
          }
          matchLen = 1;
        }
      }
      if (matchLen >= 3) {
        for (let k = 0; k < matchLen; k++) {
          matched.add(`${r},${this.cols - 1 - k}`);
        }
      }
    }

    // Vertical
    for (let c = 0; c < this.cols; c++) {
      let matchLen = 1;
      for (let r = 1; r < this.rows; r++) {
        if (this.grid[r][c] === this.grid[r - 1][c] && this.grid[r][c] !== -1) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            for (let k = 0; k < matchLen; k++) {
              matched.add(`${r - 1 - k},${c}`);
            }
          }
          matchLen = 1;
        }
      }
      if (matchLen >= 3) {
        for (let k = 0; k < matchLen; k++) {
          matched.add(`${this.rows - 1 - k},${c}`);
        }
      }
    }

    return Array.from(matched).map(key => {
      const [r, c] = key.split(',').map(Number);
      return { row: r, col: c };
    });
  }

  // ─── MATCH PROCESSING ──────────────────────────────────

  processMatches(matches) {
    this.cascadeLevel++;

    // Count scoring gems BEFORE clearing the grid
    let scoringCount = 0;
    matches.forEach((m) => {
      const type = this.grid[m.row][m.col];
      if (SCORING_TILE_INDICES.includes(type)) {
        scoringCount++;
      }
    });

    // Add fill from scoring gems
    if (scoringCount > 0) {
      this.addFill(scoringCount);

      // Show floating percentage
      const avgRow = matches.reduce((sum, m) => sum + m.row, 0) / matches.length;
      const avgCol = matches.reduce((sum, m) => sum + m.col, 0) / matches.length;
      const { x, y } = this.gemPosition(Math.round(avgRow), Math.round(avgCol));
      this.showFloatingScore(x, y, scoringCount * FILL_PER_SCORING_GEM);
    }

    this.sound.play('match', { volume: 0.4 });

    // Destroy matched gems
    let completedCount = 0;
    const totalToDestroy = matches.length;

    matches.forEach((m) => {
      const sprite = this.gemSprites[m.row][m.col];
      this.grid[m.row][m.col] = -1;
      this.gemSprites[m.row][m.col] = null;

      if (sprite) {
        this.tweens.add({
          targets: sprite,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: DESTROY_SPEED,
          ease: 'Power2',
          onComplete: () => {
            this.returnToPool(sprite);
            completedCount++;
            if (completedCount >= totalToDestroy) {
              this.time.delayedCall(CASCADE_DELAY, () => {
                this.applyGravity();
              });
            }
          },
        });
      } else {
        completedCount++;
      }
    });
  }

  showFloatingScore(x, y, fillAmount) {
    const text = this.add.text(x, y, `+${fillAmount}%`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: ACCENT_COLOR,
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  // ─── GRAVITY / FALLING ──────────────────────────────────

  applyGravity() {
    let maxDuration = 0;
    let hasTweens = false;

    for (let c = 0; c < this.cols; c++) {
      let emptySpaces = 0;

      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] === -1) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          const newRow = r + emptySpaces;
          this.grid[newRow][c] = this.grid[r][c];
          this.grid[r][c] = -1;

          const sprite = this.gemSprites[r][c];
          this.gemSprites[newRow][c] = sprite;
          this.gemSprites[r][c] = null;

          sprite.setData('row', newRow);
          const { y } = this.gemPosition(newRow, c);

          const dur = FALL_SPEED * emptySpaces;
          maxDuration = Math.max(maxDuration, dur);
          hasTweens = true;

          this.tweens.add({
            targets: sprite,
            y: y,
            duration: dur,
            ease: 'Cubic.easeIn',
          });
        }
      }

      const colDelay = c * COLUMN_STAGGER;
      for (let r = 0; r < this.rows; r++) {
        if (this.grid[r][c] === -1) {
          const type = Phaser.Math.Between(0, NUM_GEM_TYPES - 1);
          this.grid[r][c] = type;

          const { x, y } = this.gemPosition(r, c);
          const startY = this.boardY - (this.rows - r) * this.cellSize;
          const sprite = this.createGemSprite(r, c, type);
          sprite.y = startY;
          sprite.setAlpha(0);

          const dur = FALL_SPEED * (this.rows - r + 1);
          const totalDur = colDelay + dur;
          maxDuration = Math.max(maxDuration, totalDur);
          hasTweens = true;

          this.tweens.add({
            targets: sprite,
            y: y,
            alpha: 1,
            duration: dur,
            delay: colDelay,
            ease: 'Cubic.easeIn',
          });
        }
      }
    }

    if (!hasTweens) {
      this.onGravityComplete();
    } else {
      this.time.delayedCall(maxDuration * 0.7, () => {
        this.sound.play('land', { volume: 0.3 });
      });
      this.time.delayedCall(maxDuration + 200, () => {
        this.onGravityComplete();
      });
    }
  }

  onGravityComplete() {
    const newMatches = this.findMatches();
    if (newMatches.length > 0) {
      this.processMatches(newMatches);
    } else {
      if (!this.hasPossibleMoves()) {
        this.reshuffleBoard();
      } else {
        this.canMove = true;
      }
    }
  }

  // ─── OBJECT POOLING ─────────────────────────────────────

  returnToPool(sprite) {
    sprite.setVisible(false);
    sprite.setActive(false);
    sprite.removeInteractive();
    this.pool.push(sprite);
  }

  // ─── POSSIBLE MOVES CHECK ──────────────────────────────

  hasPossibleMoves() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c < this.cols - 1) {
          this.gridSwap(r, c, r, c + 1);
          if (this.findMatches().length > 0) {
            this.gridSwap(r, c, r, c + 1);
            return true;
          }
          this.gridSwap(r, c, r, c + 1);
        }
        if (r < this.rows - 1) {
          this.gridSwap(r, c, r + 1, c);
          if (this.findMatches().length > 0) {
            this.gridSwap(r, c, r + 1, c);
            return true;
          }
          this.gridSwap(r, c, r + 1, c);
        }
      }
    }
    return false;
  }

  gridSwap(r1, c1, r2, c2) {
    [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];
  }

  reshuffleBoard() {
    const types = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        types.push(this.grid[r][c]);
      }
    }

    Phaser.Utils.Array.Shuffle(types);

    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = types[idx];
        const sprite = this.gemSprites[r][c];
        sprite.setTexture(GEM_KEYS[types[idx]]);
        sprite.setData('type', types[idx]);
        idx++;
      }
    }

    this.removeInitialMatches();

    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.3).setDepth(20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        flash.destroy();
        if (!this.hasPossibleMoves()) {
          this.reshuffleBoard();
        } else {
          this.canMove = true;
        }
      },
    });

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No moves!\nShuffling...', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '40px',
      color: ACCENT_COLOR,
      fontStyle: 'bold',
      align: 'center',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(21);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: GAME_HEIGHT / 2 - 60,
      duration: 1200,
      delay: 300,
      onComplete: () => text.destroy(),
    });
  }

  // ─── GAME OVER ──────────────────────────────────────────

  gameOver(won) {
    this.canMove = false;
    if (this.timerEvent) this.timerEvent.remove();
    this.sound.play('gameover', { volume: 0.5 });

    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', {
        won: won,
        fillPercent: this.fillPercent,
        timeRemaining: this.timeRemaining,
        score: won ? this.timeRemaining : 0,
      });
    });
  }
}
