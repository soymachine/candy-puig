import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT,
  GRID_ROWS, GRID_COLS, MIN_COLS, MIN_CELL_SIZE, NUM_GEM_TYPES,
  BOARD_PADDING, BOARD_TOP_OFFSET,
  SWAP_SPEED, FALL_SPEED, DESTROY_SPEED, CASCADE_DELAY, COLUMN_STAGGER,
  TOTAL_MOVES, SWIPE_THRESHOLD,
  POINTS_PER_GEM, BONUS_PER_EXTRA, CASCADE_MULTIPLIER,
  BOARD_BG_COLOR, HIGHLIGHT_COLOR, GEM_KEYS,
} from '../config.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.score = 0;
    this.movesLeft = TOTAL_MOVES;
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

    // If cells are too small, reduce columns
    if (this.cellSize < MIN_CELL_SIZE) {
      this.cols = MIN_COLS;
      this.cellSize = Math.floor(availableWidth / this.cols);
    }

    // Calculate board dimensions and offsets
    this.boardWidth = this.cols * this.cellSize;
    this.boardHeight = this.rows * this.cellSize;
    this.boardX = (GAME_WIDTH - this.boardWidth) / 2;
    this.boardY = BOARD_TOP_OFFSET;

    // Gem visual size (slightly smaller than cell for spacing)
    this.gemDisplaySize = this.cellSize - 8;
  }

  create() {
    this.createBackground();
    this.createUI();
    this.createBoard();
    this.fillBoard();
    this.removeInitialMatches();
    this.createInputHandlers();
    this.canMove = true;
  }

  // ─── RENDERING ──────────────────────────────────────────

  createBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b4e, 0x2d1b4e);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  createUI() {
    // Score display
    this.add.text(40, 40, 'SCORE', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#9988bb',
    });
    this.scoreText = this.add.text(40, 70, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Moves display
    this.add.text(GAME_WIDTH - 40, 40, 'MOVES', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#9988bb',
    }).setOrigin(1, 0);
    this.movesText = this.add.text(GAME_WIDTH - 40, 70, String(TOTAL_MOVES), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Board background
    const boardBg = this.add.graphics();
    boardBg.fillStyle(BOARD_BG_COLOR, 0.5);
    boardBg.fillRoundedRect(
      this.boardX - 10,
      this.boardY - 10,
      this.boardWidth + 20,
      this.boardHeight + 20,
      16
    );

    // Grid lines (subtle)
    const gridLines = this.add.graphics();
    gridLines.lineStyle(1, 0xffffff, 0.05);
    for (let r = 0; r <= this.rows; r++) {
      gridLines.lineBetween(
        this.boardX, this.boardY + r * this.cellSize,
        this.boardX + this.boardWidth, this.boardY + r * this.cellSize
      );
    }
    for (let c = 0; c <= this.cols; c++) {
      gridLines.lineBetween(
        this.boardX + c * this.cellSize, this.boardY,
        this.boardX + c * this.cellSize, this.boardY + this.boardHeight
      );
    }

    // Selection highlight graphic (reused)
    this.selectionHighlight = this.add.graphics();
    this.selectionHighlight.setDepth(1);
  }

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
      sprite.setScale(this.gemDisplaySize / 200); // 200 = original gem image size
    } else {
      sprite = this.add.image(x, y, GEM_KEYS[type]);
      sprite.setScale(this.gemDisplaySize / 200);
    }

    sprite.setDepth(2);
    sprite.setData('row', row);
    sprite.setData('col', col);
    sprite.setData('type', type);
    sprite.setInteractive();

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
          // Check horizontal match (3 in a row)
          if (c >= 2 &&
            this.grid[r][c] === this.grid[r][c - 1] &&
            this.grid[r][c] === this.grid[r][c - 2]) {
            this.grid[r][c] = this.getNewType(r, c);
            this.gemSprites[r][c].setTexture(GEM_KEYS[this.grid[r][c]]);
            this.gemSprites[r][c].setData('type', this.grid[r][c]);
            hasMatches = true;
          }
          // Check vertical match (3 in a column)
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
    // Avoid horizontal neighbors
    if (col >= 2 && this.grid[row][col - 1] === this.grid[row][col - 2]) {
      avoid.add(this.grid[row][col - 1]);
    }
    // Avoid vertical neighbors
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
      if (!this.canMove) return;

      const row = gameObject.getData('row');
      const col = gameObject.getData('col');

      if (this.selectedGem === null) {
        // First selection
        this.selectGem(row, col, gameObject);
      } else {
        const selRow = this.selectedGem.getData('row');
        const selCol = this.selectedGem.getData('col');

        if (row === selRow && col === selCol) {
          // Deselect
          this.deselectGem();
        } else if (this.areAdjacent(selRow, selCol, row, col)) {
          // Adjacent: try swap
          this.deselectGem();
          this.trySwap(selRow, selCol, row, col);
        } else {
          // Not adjacent: select new gem
          this.deselectGem();
          this.selectGem(row, col, gameObject);
        }
      }
    });

    // Swipe support
    let startPointer = null;
    let startGem = null;

    this.input.on('gameobjectdown', (pointer, gameObject) => {
      startPointer = { x: pointer.x, y: pointer.y };
      startGem = gameObject;
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.canMove || !startPointer || !startGem) return;

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

        // Validate target is within bounds
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

    // Draw highlight
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

    // Pulse tween on selected gem
    this.tweens.add({
      targets: sprite,
      scaleX: (this.gemDisplaySize / 200) * 1.15,
      scaleY: (this.gemDisplaySize / 200) * 1.15,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  deselectGem() {
    if (this.selectedGem) {
      this.tweens.killTweensOf(this.selectedGem);
      this.selectedGem.setScale(this.gemDisplaySize / 200);
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

    // Swap in grid
    [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];

    const sprite1 = this.gemSprites[r1][c1];
    const sprite2 = this.gemSprites[r2][c2];

    // Swap sprite references
    [this.gemSprites[r1][c1], this.gemSprites[r2][c2]] = [this.gemSprites[r2][c2], this.gemSprites[r1][c1]];

    // Update data
    sprite1.setData('row', r2);
    sprite1.setData('col', c2);
    sprite2.setData('row', r1);
    sprite2.setData('col', c1);

    const pos1 = this.gemPosition(r1, c1);
    const pos2 = this.gemPosition(r2, c2);

    // Animate swap
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
          this.movesLeft--;
          this.movesText.setText(String(this.movesLeft));
          this.cascadeLevel = 0;
          this.processMatches(matches);
        } else {
          // No match — swap back
          this.sound.play('no-match', { volume: 0.3 });
          this.swapBack(r1, c1, r2, c2, sprite1, sprite2);
        }
      },
    });
  }

  swapBack(r1, c1, r2, c2, sprite1, sprite2) {
    // Revert grid
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

    // Calculate score
    const points = this.calculateScore(matches.length, this.cascadeLevel);
    this.score += points;
    this.scoreText.setText(String(this.score));

    // Show floating score text
    if (matches.length > 0) {
      const avgRow = matches.reduce((sum, m) => sum + m.row, 0) / matches.length;
      const avgCol = matches.reduce((sum, m) => sum + m.col, 0) / matches.length;
      const { x, y } = this.gemPosition(Math.round(avgRow), Math.round(avgCol));
      this.showFloatingScore(x, y, points);
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

  calculateScore(matchCount, cascadeLevel) {
    const base = matchCount * POINTS_PER_GEM;
    const bonus = Math.max(0, matchCount - 3) * BONUS_PER_EXTRA;
    const multiplier = 1 + (cascadeLevel - 1) * CASCADE_MULTIPLIER;
    return Math.floor((base + bonus) * multiplier);
  }

  showFloatingScore(x, y, points) {
    const text = this.add.text(x, y, `+${points}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: '#ffdd00',
      fontStyle: 'bold',
      stroke: '#000000',
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

      // Bottom to top
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] === -1) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          // Move gem down
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
            ease: 'Bounce.easeOut',
          });
        }
      }

      // Fill empty top positions with new gems (staggered per column)
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
            ease: 'Bounce.easeOut',
          });
        }
      }
    }

    if (!hasTweens) {
      this.onGravityComplete();
    } else {
      // Wait for the longest tween plus a safe buffer
      this.time.delayedCall(maxDuration + 200, () => {
        this.onGravityComplete();
      });
    }
  }

  onGravityComplete() {
    const newMatches = this.findMatches();
    if (newMatches.length > 0) {
      this.processMatches(newMatches); // Cascade!
    } else {
      // Check game state
      if (this.movesLeft <= 0) {
        this.gameOver();
      } else if (!this.hasPossibleMoves()) {
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
        // Try swap right
        if (c < this.cols - 1) {
          this.gridSwap(r, c, r, c + 1);
          if (this.findMatches().length > 0) {
            this.gridSwap(r, c, r, c + 1);
            return true;
          }
          this.gridSwap(r, c, r, c + 1);
        }
        // Try swap down
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
    // Collect all types
    const types = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        types.push(this.grid[r][c]);
      }
    }

    // Shuffle
    Phaser.Utils.Array.Shuffle(types);

    // Reassign
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

    // Remove any matches created by shuffle
    this.removeInitialMatches();

    // Animate a quick flash
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.3).setDepth(20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        flash.destroy();
        if (!this.hasPossibleMoves()) {
          // If still no moves after shuffle, try again
          this.reshuffleBoard();
        } else {
          this.canMove = true;
        }
      },
    });

    // Show "Shuffled!" text
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No moves!\nShuffling...', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '40px',
      color: '#ffdd00',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
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

  gameOver() {
    this.canMove = false;
    this.sound.play('gameover', { volume: 0.5 });

    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', { score: this.score });
    });
  }
}
