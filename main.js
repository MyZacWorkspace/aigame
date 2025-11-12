// ==================== GAME STATE ====================
const gameState = {
  credits: 100,
  health: 20,
  wave: 0,
  waveActive: false,
  selectedTower: null,
  gameOver: false,
};

function resetGameState() {
  gameState.credits = 100;
  gameState.health = 20;
  gameState.wave = 0;
  gameState.waveActive = false;
  gameState.selectedTower = null;
  gameState.gameOver = false;
  towers = [];
  enemies = [];
  projectiles = [];
  waveIndex = 0;
  waveSpawnQueue = [];
  frameCount = 0;
}

const gameConfig = {
  canvasWidth: 1000,
  canvasHeight: 600,
  basePathPoints: [
    { x: -20, y: 300 },
    { x: 150, y: 100 },
    { x: 400, y: 200 },
    { x: 600, y: 100 },
    { x: 800, y: 350 },
    { x: 1020, y: 300 },
  ],
  pathPoints: [], // Will be populated with randomized path
};

// Responsive canvas handling: logical coordinate system stays at gameConfig.canvasWidth/Height
function resizeCanvas() {
  const hud = document.getElementById('hud');
  const hudHeight = hud ? hud.getBoundingClientRect().height : 80;

  // Preferred maximum CSS width is window width minus small margins
  const maxCssWidth = Math.max(300, window.innerWidth - 20);
  const maxCssHeight = Math.max(200, window.innerHeight - hudHeight - 40);

  // Maintain aspect ratio of logical canvas
  const aspect = gameConfig.canvasWidth / gameConfig.canvasHeight;
  // Use full available width on landscape devices (priority width over height)
  const isLandscape = window.innerWidth > window.innerHeight;
  let cssWidth = Math.min(maxCssWidth, gameConfig.canvasWidth);
  let cssHeight = Math.round(cssWidth / aspect);

  if (!isLandscape) {
    // In portrait / non-landscape, ensure it fits within available height
    if (cssHeight > maxCssHeight) {
      cssHeight = maxCssHeight;
      cssWidth = Math.round(cssHeight * aspect);
    }
  } else {
    // Landscape: prefer width (allow height to exceed viewport if necessary so the canvas is wide)
    cssWidth = maxCssWidth;
    cssHeight = Math.round(cssWidth / aspect);
  }

  // Apply CSS size (this scales the displayed canvas while keeping logical resolution)
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';

  // Keep the internal drawing buffer at the logical size (no DPR scaling here to avoid coordinate confusion)
  canvas.width = gameConfig.canvasWidth;
  canvas.height = gameConfig.canvasHeight;
}

function clientToLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = gameConfig.canvasWidth / rect.width;
  const scaleY = gameConfig.canvasHeight / rect.height;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;
  return { x, y };
}

// Function to generate a randomized path
function generateRandomPath() {
  const base = gameConfig.basePathPoints;
  const randomized = [
    base[0], // Keep start fixed
  ];

  // Randomize middle points
  for (let i = 1; i < base.length - 1; i++) {
    const deviation = 50;
    const x = base[i].x + (Math.random() - 0.5) * deviation;
    const y = base[i].y + (Math.random() - 0.5) * deviation;
    randomized.push({
      x: Math.max(20, Math.min(980, x)), // Keep within bounds
      y: Math.max(20, Math.min(580, y)),
    });
  }

  randomized.push(base[base.length - 1]); // Keep end fixed
  return randomized;
}

// ==================== ENTITIES ====================

class Enemy {
  constructor(type, startIndex = 0) {
    this.type = type; // 'virus', 'worm', 'ransomware', 'ddos', 'phishing'
    this.totalProgress = 0; // Total distance along entire path
    this.alive = true;
    this.health = this.getStats().health;

    const stats = this.getStats();
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.reward = stats.reward;
  }

  getStats() {
    const stats = {
      virus: { health: 1, speed: 2.8, damage: 1, reward: 7, color: '#ff6b6b', emoji: '🦠' },
      worm: { health: 2, speed: 1.7, damage: 2, reward: 15, color: '#ff9999', emoji: '🐍' },
      ransomware: { health: 4, speed: 0.8, damage: 5, reward: 35, color: '#ffcc00', emoji: '💣' },
      ddos: { health: 1, speed: 3.5, damage: 1, reward: 7, color: '#ff3333', emoji: '🌐' },
      phishing: { health: 1, speed: 2.1, damage: 1, reward: 7, color: '#ff99ff', emoji: '🎭' },
    };
    return stats[this.type];
  }

  update() {
    if (!this.alive) return;
    this.totalProgress += this.speed;

    // Check if reached the end
    const pathLength = this.getPathLength();
    if (this.totalProgress >= pathLength) {
      this.alive = false;
      gameState.health -= this.damage;
    }
  }

  getPathLength() {
    const pathPoints = gameConfig.pathPoints;
    let length = 0;
    for (let i = 1; i < pathPoints.length; i++) {
      const dx = pathPoints[i].x - pathPoints[i - 1].x;
      const dy = pathPoints[i].y - pathPoints[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  getPosition() {
    const pathPoints = gameConfig.pathPoints;
    let distance = 0;

    // Find which segment we're on
    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1];
      const curr = pathPoints[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (distance + segmentLength >= this.totalProgress) {
        // We're on this segment
        const t = (this.totalProgress - distance) / segmentLength;
        const x = prev.x + (curr.x - prev.x) * t;
        const y = prev.y + (curr.y - prev.y) * t;
        return { x, y };
      }

      distance += segmentLength;
    }

    // Reached the end
    return pathPoints[pathPoints.length - 1];
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
      gameState.credits += this.reward;
    }
  }
}

class Projectile {
  constructor(fromX, fromY, toX, toY, towerType) {
    this.startX = fromX;
    this.startY = fromY;
    this.targetX = toX;
    this.targetY = toY;
    this.towerType = towerType;
    this.progress = 0;
    this.speed = 0.15; // 0-1 scale per frame
    this.alive = true;

    const towerColors = {
      firewall: { color: '#ff6b6b', projectile: '→' },
      ids: { color: '#4a90e2', projectile: '◆' },
      honeypot: { color: '#ffd700', projectile: '●' },
      patch: { color: '#00ff00', projectile: '✨' },
    };

    this.color = towerColors[towerType]?.color || '#fff';
    this.projectile = towerColors[towerType]?.projectile || '●';
  }

  update() {
    this.progress += this.speed;
    if (this.progress >= 1) {
      this.alive = false;
    }
  }

  getPosition() {
    const x = this.startX + (this.targetX - this.startX) * this.progress;
    const y = this.startY + (this.targetY - this.startY) * this.progress;
    return { x, y };
  }
}

class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'firewall', 'ids', 'honeypot', 'patch'
    this.active = false;

    const stats = this.getStats();
    this.range = stats.range;
    this.damage = stats.damage;
    this.fireRate = stats.fireRate;
    this.timeSinceShot = 0;
    this.color = stats.color;
    this.emoji = stats.emoji;
  }

  getStats() {
    const stats = {
      firewall: {
        range: 120,
        damage: 1,
        fireRate: 0.5,
        color: '#ff6b6b',
        emoji: '🔥',
      },
      ids: {
        range: 180,
        damage: 1.5,
        fireRate: 0.3,
        color: '#4a90e2',
        emoji: '🕵️',
      },
      honeypot: {
        range: 100,
        damage: 0.5,
        fireRate: 1,
        color: '#ffd700',
        emoji: '🪤',
      },
      patch: {
        range: 150,
        damage: 0,
        fireRate: 0.5,
        color: '#00ff00',
        emoji: '⚡',
      },
    };
    return stats[this.type];
  }

  update(enemies) {
    this.timeSinceShot += 1 / 60;
    this.active = false;

    if (this.type === 'patch') {
      // Patch heals the network ONLY during active waves
      if (gameState.waveActive && this.timeSinceShot >= 1 / this.fireRate && gameState.health < 20) {
        gameState.health = Math.min(gameState.health + 1, 20);
        this.timeSinceShot = 0;
        this.active = true;
      }
      return;
    }

    // Find target
    let closestEnemy = null;
    let closestDist = this.range;

    for (let enemy of enemies) {
      if (!enemy.alive) continue;
      const pos = enemy.getPosition();
      const dist = Math.sqrt((pos.x - this.x) ** 2 + (pos.y - this.y) ** 2);

      if (dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy && this.timeSinceShot >= 1 / this.fireRate) {
      // Create projectile
      const targetPos = closestEnemy.getPosition();
      projectiles.push(new Projectile(this.x, this.y, targetPos.x, targetPos.y, this.type));
      
      closestEnemy.takeDamage(this.damage);
      this.timeSinceShot = 0;
      this.active = true;
    }
  }
}

// ==================== GAME LOGIC ====================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let towers = [];
let enemies = [];
let projectiles = [];
let waveIndex = 0;

const waves = [
  { name: 'Home Wi-Fi', enemies: [{ type: 'virus', count: 5, delay: 0.5 }], delay: 1 },
  {
    name: 'Small Business',
    enemies: [
      { type: 'virus', count: 8, delay: 0.3 },
      { type: 'worm', count: 3, delay: 0.5 },
    ],
    delay: 1,
  },
  {
    name: 'Corporate Network',
    enemies: [
      { type: 'virus', count: 10, delay: 0.2 },
      { type: 'worm', count: 5, delay: 0.4 },
      { type: 'ransomware', count: 2, delay: 1 },
    ],
    delay: 0.8,
  },
  {
    name: 'Mixed Threats',
    enemies: [
      { type: 'ddos', count: 15, delay: 0.1 },
      { type: 'phishing', count: 3, delay: 0.6 },
    ],
    delay: 0.5,
  },
];

let waveSpawnQueue = [];
let frameCount = 0;

function startWave() {
  if (gameState.waveActive || gameState.gameOver) return;

  waveIndex = Math.min(waveIndex + 1, waves.length - 1);
  gameState.wave = waveIndex;
  gameState.waveActive = true;

  // Generate a new randomized path for this wave
  gameConfig.pathPoints = generateRandomPath();

  const wave = waves[waveIndex - 1];
  waveSpawnQueue = [];

  wave.enemies.forEach((enemyGroup) => {
    let spawnTime = 0;
    for (let i = 0; i < enemyGroup.count; i++) {
      waveSpawnQueue.push({ type: enemyGroup.type, time: spawnTime });
      spawnTime += enemyGroup.delay * 60;
    }
  });

  frameCount = 0;
}

function getTowerCost(type) {
  const costs = { firewall: 25, ids: 40, honeypot: 35, patch: 50 };
  return costs[type];
}

function placeTower(x, y, type) {
  const cost = getTowerCost(type);
  if (gameState.credits < cost) {
    showMessage('Not enough credits!');
    return false;
  }

  towers.push(new Tower(x, y, type));
  gameState.credits -= cost;
  gameState.selectedTower = null;
  showMessage(`${type} placed!`);
  return true;
}

function showMessage(msg) {
  const el = document.getElementById('message');
  el.textContent = msg;
  setTimeout(() => (el.textContent = ''), 2000);
}

function update() {
  if (gameState.gameOver) {
    return;
  }

  // Check for health <= 0 (game over loss condition)
  if (gameState.health <= 0) {
    gameState.gameOver = true;
    showMessage('💀 Game Over! Network Compromised!');
    document.getElementById('restartBtn').style.display = 'inline-block';
    return;
  }

  // Spawn enemies
  const toRemove = [];
  waveSpawnQueue.forEach((spawn, idx) => {
    if (frameCount === spawn.time) {
      enemies.push(new Enemy(spawn.type));
      toRemove.push(idx);
    }
  });

  toRemove.reverse().forEach((idx) => waveSpawnQueue.splice(idx, 1));

  if (waveSpawnQueue.length === 0 && enemies.filter((e) => e.alive).length === 0) {
    gameState.waveActive = false;
    if (waveIndex === waves.length) {
      gameState.gameOver = true;
      showMessage('🎉 Victory! All waves defeated!');
      document.getElementById('restartBtn').style.display = 'inline-block';
    }
  }

  // Update entities
  enemies.forEach((enemy) => enemy.update());
  towers.forEach((tower) => tower.update(enemies));
  projectiles.forEach((projectile) => projectile.update());

  enemies = enemies.filter((e) => e.alive);
  projectiles = projectiles.filter((p) => p.alive);

  frameCount++;
}

function draw() {
  ctx.fillStyle = '#0a1428';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw title at top right
  ctx.fillStyle = '#ff8800';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(255, 136, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillText('🔥 Firewall Frenzy 🧱', canvas.width - 20, 15);
  ctx.shadowColor = 'transparent';

  // Draw path
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 40;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(gameConfig.pathPoints[0].x, gameConfig.pathPoints[0].y);
  for (let i = 1; i < gameConfig.pathPoints.length; i++) {
    ctx.lineTo(gameConfig.pathPoints[i].x, gameConfig.pathPoints[i].y);
  }
  ctx.stroke();

  // Draw network host at path destination
  let hostX = gameConfig.pathPoints[gameConfig.pathPoints.length - 1].x;
  let hostY = gameConfig.pathPoints[gameConfig.pathPoints.length - 1].y;
  
  // Adjust position if too close to edges
  hostX = Math.max(60, Math.min(hostX, canvas.width - 60));
  hostY = Math.max(80, Math.min(hostY, canvas.height - 80));
  
  // Draw host emoji
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🖥️', hostX, hostY - 8);
  
  // Draw "Host" label below
  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('HOST', hostX, hostY + 25);
  
  // Reset fill style
  ctx.fillStyle = '#ffffff';

  // Draw towers
  towers.forEach((tower) => {
    ctx.fillStyle = tower.color;
    ctx.globalAlpha = tower.active ? 1 : 0.6;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tower.emoji, tower.x, tower.y);

    // Draw range indicator on hover
    if (gameState.selectedTower && gameState.selectedTower.x === tower.x && gameState.selectedTower.y === tower.y) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Draw enemies
  enemies.forEach((enemy) => {
    const pos = enemy.getPosition();
    ctx.fillStyle = enemy.getStats().color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.getStats().emoji, pos.x, pos.y);

    // Health bar
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(pos.x - 12, pos.y - 25, 24, 4);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(pos.x - 12, pos.y - 25, (24 * enemy.health) / enemy.getStats().health, 4);
  });

  // Draw tower placement preview
  if (gameState.selectedTower && !gameState.waveActive) {
    const preview = gameState.selectedTower;
    
    // Get tower stats for the preview
    const towerStats = {
      firewall: { range: 120, color: '#ff6b6b', emoji: '🔥' },
      ids: { range: 180, color: '#4a90e2', emoji: '🕵️' },
      honeypot: { range: 100, color: '#ffd700', emoji: '🪤' },
      patch: { range: 150, color: '#00ff00', emoji: '⚡' },
    };
    
    const stats = towerStats[preview.type];
    if (stats) {
      // Draw range circle (semi-transparent)
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(preview.x, preview.y, stats.range, 0, Math.PI * 2);
      ctx.stroke();

      // Draw tower preview
      ctx.fillStyle = stats.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(preview.x, preview.y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stats.emoji, preview.x, preview.y);
    }
  }

  // Draw projectiles
  projectiles.forEach((projectile) => {
    const pos = projectile.getPosition();
    
    // Draw projectile glow
    ctx.fillStyle = projectile.color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    // Draw projectile symbol
    ctx.fillStyle = projectile.color;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(projectile.projectile, pos.x, pos.y);
    
    // Draw trail line
    ctx.strokeStyle = projectile.color;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(projectile.startX, projectile.startY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function gameLoop() {
  update();
  draw();

  // Check for game over conditions and show restart button
  if (gameState.gameOver) {
    document.getElementById('restartBtn').style.display = 'inline-block';
  }

  // Update UI
  document.getElementById('credits').textContent = gameState.credits;
  if(gameState.health < 0)
    gameState.health = 0;
  document.getElementById('health').textContent = gameState.health;
  document.getElementById('wave').textContent = gameState.wave;

  // Disable tower buttons during waves
  const towerButtons = [
    document.getElementById('towerBtn'),
    document.getElementById('idsBtn'),
    document.getElementById('honeypotBtn'),
    document.getElementById('patchBtn')
  ];
  towerButtons.forEach(btn => {
    btn.disabled = gameState.waveActive;
    btn.style.opacity = gameState.waveActive ? '0.5' : '1';
  });

  // Disable start wave button during waves
  const startWaveBtn = document.getElementById('startWave');
  startWaveBtn.disabled = gameState.waveActive;
  startWaveBtn.style.opacity = gameState.waveActive ? '0.5' : '1';

  requestAnimationFrame(gameLoop);
}

// ==================== EVENT LISTENERS ====================

// Pointer events unify mouse/touch input. Convert client coords -> logical canvas coords.
canvas.addEventListener('pointerdown', (e) => {
  if (gameState.waveActive) return;
  if (!gameState.selectedTower) return;

  const pos = clientToLogical(e.clientX, e.clientY);
  placeTower(pos.x, pos.y, gameState.selectedTower.type);
  e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
  if (!gameState.selectedTower) return;
  const pos = clientToLogical(e.clientX, e.clientY);
  gameState.selectedTower.x = pos.x;
  gameState.selectedTower.y = pos.y;
});

// Prevent default touch behavior on the canvas for better touch gameplay
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

document.getElementById('towerBtn').addEventListener('click', () => {
  gameState.selectedTower = { type: 'firewall', x: 0, y: 0 };
  showMessage('🔥 Firewall selected - Click to place ($25)');
});

document.getElementById('idsBtn').addEventListener('click', () => {
  gameState.selectedTower = { type: 'ids', x: 0, y: 0 };
  showMessage('🕵️ IDS selected - Click to place ($40)');
});

document.getElementById('honeypotBtn').addEventListener('click', () => {
  gameState.selectedTower = { type: 'honeypot', x: 0, y: 0 };
  showMessage('🪤 Honeypot selected - Click to place ($35)');
});

document.getElementById('patchBtn').addEventListener('click', () => {
  gameState.selectedTower = { type: 'patch', x: 0, y: 0 };
  showMessage('⚡ Patch Server selected - Click to place ($50)');
});

document.getElementById('startWave').addEventListener('click', startWave);

document.getElementById('restartBtn').addEventListener('click', () => {
  resetGameState();
  document.getElementById('restartBtn').style.display = 'none';
  showMessage('Game restarted!');
});

// Tower Info Modal
document.getElementById('helpBtn').addEventListener('click', () => {
  document.getElementById('helpModal').style.display = 'flex';
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('helpModal').style.display = 'none';
});

document.getElementById('helpModal').addEventListener('click', (e) => {
  if (e.target.id === 'helpModal') {
    document.getElementById('helpModal').style.display = 'none';
  }
});

// Initialize the game with first random path
gameConfig.pathPoints = generateRandomPath();

// Setup resize handling and start
window.addEventListener('resize', () => {
  resizeCanvas();
});
window.addEventListener('orientationchange', () => {
  setTimeout(resizeCanvas, 200);
});

// Make canvas responsive and start loop
resizeCanvas();
gameLoop();
