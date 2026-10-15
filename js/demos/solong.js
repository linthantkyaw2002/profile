// Playable browser adaptation of the user's 42 so_long game.
// All original art is provided in assets/sprites/solong/. No C engine is executed.
const TILE = 32;
const SPRITE_ROOT = 'assets/sprites/solong/';
const GAME_LEVELS = [
    {
        name: 'Mossy Passage',
        map: [
            '#################',
            '#P....#.....C...#',
            '#.##..#..##.....#',
            '#....C.....#....#',
            '###.####...#..#.#',
            '#...#......#..#.#',
            '#...#..##.......#',
            '#.C....#....##..#',
            '#......#....X...#',
            '#............E..#',
            '#################'
        ]
    },
    {
        name: 'Goblin Crossing',
        map: [
            '#################',
            '#P....#....C....#',
            '#.#...#..##...#.#',
            '#.#...........#.#',
            '#...##...X......#',
            '###......##.....#',
            '#..C..#.......#.#',
            '#...#.#..H......#',
            '#.....#....C....#',
            '#......E........#',
            '#################'
        ]
    },
    {
        name: 'Last Watch',
        map: [
            '#################',
            '#P..C....#......#',
            '#....##..#...#..#',
            '#...#......X....#',
            '#...#...##......#',
            '#.......#..C..#.#',
            '#..#....#.....#.#',
            '#..#..H.....##..#',
            '#..C.....X......#',
            '#.......#......E#',
            '#################'
        ]
    }
];

const SPRITE_FILES = {
    floor: ['floor.png'], wall: ['wall.png'],
    playerR: Array.from({ length: 6 }, (_, i) => `player/playerR${i}.png`),
    playerL: Array.from({ length: 6 }, (_, i) => `player/playerL${i}.png`),
    coin: Array.from({ length: 5 }, (_, i) => `coin/coin${String(i).padStart(3, '0')}.png`),
    exit: Array.from({ length: 3 }, (_, i) => `exit/exit${i}.png`),
    enemyR: Array.from({ length: 8 }, (_, i) => `enemy/enemyR${i}.png`),
    enemyL: Array.from({ length: 8 }, (_, i) => `enemy/flipped/enemyL${i}.png`),
    enemyAttack: Array.from({ length: 6 }, (_, i) => `enemyatk/enemyatk${i}.png`)
};

// Keep the map constraints comparable to a so_long .ber file: rectangle, closed
// perimeter, one P and one E, collectible(s), and a traversable solution.
function validateLevel(map) {
    const width = map[0]?.length;
    if (!width || map.length < 3 || !map.every(row => row.length === width)) throw Error('Non-rectangular level');
    const starts = [], exits = [], coins = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < width; x++) {
            const c = map[y][x];
            if (!'#.PCEXH'.includes(c)) throw Error('Unsupported tile: ' + c);
            if ((y === 0 || y === map.length - 1 || x === 0 || x === width - 1) && c !== '#') throw Error('Open level perimeter');
            if (c === 'P') starts.push([x, y]);
            if (c === 'E') exits.push([x, y]);
            if (c === 'C') coins.push([x, y]);
        }
    }
    if (starts.length !== 1 || exits.length !== 1 || !coins.length) throw Error('Invalid P/E/C count');
    const key = ([x,y]) => `${x},${y}`;
    const visited = new Set([key(starts[0])]);
    const queue = [starts[0]];
    for (let i = 0; i < queue.length; i++) {
        const [x,y] = queue[i];
        for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx=x+dx,ny=y+dy;
            if (!map[ny] || !map[ny][nx] || map[ny][nx] === '#' || visited.has(`${nx},${ny}`)) continue;
            visited.add(`${nx},${ny}`); queue.push([nx,ny]);
        }
    }
    if (![...coins, ...exits].every(pos => visited.has(key(pos)))) throw Error('Inaccessible coin or exit');
}
GAME_LEVELS.forEach(level => validateLevel(level.map));

export function createSoLongDemo({ container, backToShell }) {
    container.innerHTML = `
        <div class="solong-demo">
            <div class="solong-header">
                <div>
                    <span class="solong-eyebrow">42 GAME / BROWSER ADAPTATION</span>
                    <h2>so_long <span>· Mini Adventure</span></h2>
                </div>
                <button type="button" class="solong-back">← Minishell</button>
            </div>
            <div class="solong-toolbar">
                <span class="solong-level-tag">LEVEL <strong class="solong-level-number">01</strong> / 03</span>
                <span class="solong-level-name">Mossy Passage</span>
                <button type="button" class="solong-restart" title="Restart the current level">↻ Restart</button>
            </div>
            <div class="solong-layout">
                <div class="solong-board-column">
                    <div class="solong-screen" tabindex="0" aria-label="Playable so_long map. Use WASD or the arrow keys to move.">
                        <canvas class="solong-canvas" width="544" height="352" aria-label="Pixel-art game board"></canvas>
                        <div class="solong-overlay" aria-live="polite">
                            <div class="solong-overlay-panel">
                                <span class="solong-overlay-kicker">PIXEL ADVENTURE</span>
                                <h3 class="solong-overlay-title">so_long</h3>
                                <p class="solong-overlay-message">Collect every coin, avoid the goblins, and reach the exit.</p>
                                <button type="button" class="my-button solong-action">Play Game ↗</button>
                            </div>
                        </div>
                    </div>
                    <div class="solong-board-caption"><span class="solong-caption-status" role="status" aria-live="polite">Ready to play.</span><span>WASD / ↑ ↓ ← →</span></div>
                </div>
                <aside class="solong-side" aria-label="Game status and controls">
                    <div class="solong-stat-group">
                        <div class="solong-stat"><span>Coins</span><strong class="solong-coins">0 / 0</strong></div>
                        <div class="solong-stat"><span>Moves</span><strong class="solong-moves">0</strong></div>
                        <div class="solong-stat"><span>Exit</span><strong class="solong-exit-state">LOCKED</strong></div>
                    </div>
                    <div class="solong-guide"><span>OBJECTIVE</span><p>Collect all coins to unlock the door. Watch out for patrolling goblins.</p></div>
                    <div class="solong-touch-label">MOVE / TOUCH CONTROLS</div>
                    <div class="solong-pad" aria-label="On-screen direction controls">
                        <button type="button" data-move="up" class="solong-up" aria-label="Move up">↑</button>
                        <button type="button" data-move="left" class="solong-left" aria-label="Move left">←</button>
                        <button type="button" data-move="down" class="solong-down" aria-label="Move down">↓</button>
                        <button type="button" data-move="right" class="solong-right" aria-label="Move right">→</button>
                    </div>
                    <p class="solong-hint">Press <kbd>R</kbd> to restart. Enemies move while you play.</p>
                </aside>
            </div>
            <p class="solong-disclaimer">Play the browser adaptation using sprites from the original project. The C / MiniLibX game is available in the source repository.</p>
        </div>`;

    const $ = s => container.querySelector(s);
    const board = $('.solong-screen');
    const canvas = $('.solong-canvas');
    const ctx = canvas.getContext('2d');
    const overlay = $('.solong-overlay');
    const overlayTitle = $('.solong-overlay-title');
    const overlayMessage = $('.solong-overlay-message');
    const overlayKicker = $('.solong-overlay-kicker');
    const actionButton = $('.solong-action');
    const message = $('.solong-caption-status');
    const coinsText = $('.solong-coins');
    const movesText = $('.solong-moves');
    const exitText = $('.solong-exit-state');
    const levelNumber = $('.solong-level-number');
    const levelName = $('.solong-level-name');
    const sprites = {};
    const paths = Object.entries(SPRITE_FILES).flatMap(([key, files]) => files.map((path,i) => [key,i,path]));
    let imagesLoaded = false;
    let destroyed = false;
    let frame = 0;
    let levelIndex = 0;
    let stage = 'title';
    let grid = [];
    let player = {x:1,y:1,dir:'R'};
    let enemies = [];
    let totalCoins = 0;
    let coinsCollected = 0;
    let moves = 0;
    let lastEnemyStep = 0;
    let timeDead = 0;
    let lastMoveAt = 0;

    // Asset decode starts on demo open. No network dependency besides the site's own PNGs.
    const loaded = paths.map(([key,i,path]) => new Promise(resolve => {
        const image = new Image();
        if (!sprites[key]) sprites[key] = [];
        sprites[key][i] = image;
        image.onload = resolve;
        image.onerror = resolve; // Renderer has a non-crashing placeholder if an image is missing.
        image.src = SPRITE_ROOT + path;
    }));
    Promise.all(loaded).then(() => { if (!destroyed) imagesLoaded = true; });

    function initLevel(index) {
        levelIndex = index;
        const level = GAME_LEVELS[index];
        grid = level.map.map(line => line.split(''));
        enemies = [];
        totalCoins = 0;
        coinsCollected = 0;
        moves = 0;
        lastEnemyStep = 0;
        timeDead = 0;
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const tile = grid[y][x];
                if (tile === 'P') { player = { x,y,dir:'R' }; grid[y][x] = '.'; }
                else if (tile === 'C') totalCoins++;
                else if (tile === 'X' || tile === 'H') {
                    enemies.push({ x,y, axis:tile === 'X' ? 'x':'y', dir:1, face:'R' });
                    grid[y][x] = '.';
                }
            }
        }
        canvas.width = grid[0].length * TILE;
        canvas.height = grid.length * TILE;
        levelNumber.textContent = String(index + 1).padStart(2, '0');
        levelName.textContent = level.name;
        message.textContent = 'Collect every coin and find the exit.';
        refreshStats();
    }

    function refreshStats() {
        coinsText.textContent = `${coinsCollected} / ${totalCoins}`;
        movesText.textContent = String(moves);
        exitText.textContent = coinsCollected === totalCoins ? 'OPEN' : 'LOCKED';
        exitText.classList.toggle('is-open', coinsCollected === totalCoins);
    }

    function showOverlay(kicker, title, text, buttonLabel) {
        overlayKicker.textContent = kicker;
        overlayTitle.textContent = title;
        overlayMessage.textContent = text;
        actionButton.textContent = buttonLabel;
        overlay.hidden = false;
        board.classList.add('has-overlay');
    }

    function hideOverlay() {
        overlay.hidden = true;
        board.classList.remove('has-overlay');
        board.focus({preventScroll:true});
    }

    function startLevel(index = levelIndex) {
        initLevel(index);
        stage = 'playing';
        hideOverlay();
        message.textContent = 'Find the coins. Avoid the goblins!';
    }

    function die() {
        if (stage !== 'playing') return;
        stage = 'dead';
        timeDead = performance.now();
        message.textContent = 'A goblin caught you. Try again.';
        showOverlay('GAME OVER', 'Caught by a goblin', 'You can retry this level. Your moves and coins will reset.', 'Retry Level ↗');
    }

    function win() {
        if (stage !== 'playing') return;
        const last = levelIndex === GAME_LEVELS.length - 1;
        stage = last ? 'complete' : 'won';
        message.textContent = last ? 'Adventure complete!' : 'Level completed!';
        showOverlay(last ? 'ALL LEVELS COMPLETE' : 'LEVEL CLEAR', last ? 'Adventure complete!' : 'Well played!',
            last ? 'You cleared all three levels. Play again whenever you like.' : `You collected every coin in ${moves} moves. Ready for the next map?`,
            last ? 'Play Again ↗' : 'Next Level ↗');
    }

    function isWalkable(x,y) {
        return grid[y]?.[x] !== undefined && grid[y][x] !== '#';
    }

    function movePlayer(dx,dy) {
        if (stage !== 'playing') return;
        const now = performance.now();
        if (now - lastMoveAt < 85) return;
        lastMoveAt = now;
        if (dx) player.dir = dx < 0 ? 'L' : 'R';
        const x=player.x+dx, y=player.y+dy;
        if (!isWalkable(x,y)) { message.textContent = 'A rock blocks the way.'; return; }
        if (grid[y][x] === 'E' && coinsCollected < totalCoins) {
            message.textContent = `Exit locked — ${totalCoins-coinsCollected} coin${totalCoins-coinsCollected===1?'':'s'} left.`;
            return;
        }
        player.x=x; player.y=y; moves++;
        if (enemies.some(e => e.x === x && e.y === y)) { refreshStats(); die(); return; }
        if (grid[y][x] === 'C') {
            grid[y][x] = '.';
            coinsCollected++;
            message.textContent = coinsCollected === totalCoins ? 'All coins collected — the exit is OPEN!' : 'Coin collected!';
        } else if (grid[y][x] !== 'E') {
            message.textContent = 'Keep exploring.';
        }
        refreshStats();
        if (grid[y][x] === 'E') win();
    }

    function patrol() {
        for (const enemy of enemies) {
            const dx = enemy.axis === 'x' ? enemy.dir : 0;
            const dy = enemy.axis === 'y' ? enemy.dir : 0;
            const blocked = (nx,ny) => !isWalkable(nx,ny) || grid[ny][nx] === 'E' || enemies.some(other => other !== enemy && other.x === nx && other.y === ny);
            let nx = enemy.x + dx, ny = enemy.y + dy;
            if (blocked(nx,ny)) {
                enemy.dir *= -1;
                nx = enemy.x + (enemy.axis === 'x' ? enemy.dir : 0);
                ny = enemy.y + (enemy.axis === 'y' ? enemy.dir : 0);
            }
            if (!blocked(nx,ny)) {
                enemy.x = nx; enemy.y = ny;
                if (enemy.axis === 'x') enemy.face = enemy.dir === 1 ? 'R' : 'L';
            }
            if (enemy.x === player.x && enemy.y === player.y) die();
        }
    }

    function draw(name, index, x, y, fallback) {
        const seq = sprites[name];
        const image = seq?.[index % seq.length];
        if (imagesLoaded && image?.complete && image.naturalWidth) {
            ctx.drawImage(image, x * TILE, y * TILE, TILE, TILE);
        } else {
            ctx.fillStyle = fallback;
            ctx.fillRect(x*TILE+2, y*TILE+2, TILE-4, TILE-4);
        }
    }

    function render(now) {
        if (destroyed) return;
        const anim = Math.floor(now / 145);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y=0; y<grid.length; y++) {
            for (let x=0; x<grid[y].length; x++) {
                const tile = grid[y][x];
                draw('floor',0,x,y,'#47764b');
                if (tile === '#') draw('wall',0,x,y,'#67716c');
                if (tile === 'C') draw('coin', Math.floor(now/175)%5,x,y,'#ffca39');
                if (tile === 'E') draw('exit', coinsCollected === totalCoins ? 1 + Math.floor(now/470)%2 : 0,x,y,'#85573a');
            }
        }
        for (const enemy of enemies) {
            if (stage === 'dead' && now - timeDead < 700 && Math.abs(enemy.x-player.x)+Math.abs(enemy.y-player.y) < 2)
                draw('enemyAttack', Math.floor((now-timeDead)/115)%6,enemy.x,enemy.y,'#ad5d41');
            else draw(enemy.face === 'L' ? 'enemyL':'enemyR', Math.floor(now/115)%8,enemy.x,enemy.y,'#7fa038');
        }
        draw(player.dir === 'L' ? 'playerL':'playerR', stage === 'playing' ? anim%6 : 0,player.x,player.y,'#b4dee1');
        if (stage === 'playing' && (!lastEnemyStep || now-lastEnemyStep > 660)) {
            lastEnemyStep = now;
            patrol();
        }
        frame = requestAnimationFrame(render);
    }

    function onKey(event) {
        if (destroyed || !container.isConnected) return;
        // Keep page scrolling and button activation unaffected unless playing a game.
        const key = event.key.toLowerCase();
        const directions = {arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
        if (key in directions) {
            if (stage === 'playing') { event.preventDefault(); movePlayer(...directions[key]); }
        } else if (key === 'r' && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault(); startLevel(levelIndex);
        }
    }

    actionButton.addEventListener('click', () => {
        if (stage === 'won') startLevel(levelIndex+1);
        else if (stage === 'complete') startLevel(0);
        else startLevel(levelIndex);
    });
    $('.solong-restart').addEventListener('click', () => startLevel(levelIndex));
    $('.solong-back').addEventListener('click', backToShell);
    container.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => {
        const move = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[button.dataset.move];
        movePlayer(...move);
        board.focus({preventScroll:true});
    }));
    document.addEventListener('keydown', onKey);
    initLevel(0);
    showOverlay('PIXEL ADVENTURE', 'so_long', 'Collect every coin, avoid the goblins, and reach the exit.', 'Play Game ↗');
    frame = requestAnimationFrame(render);
    return {
        focus() { if (!destroyed) { if (stage === 'playing') board.focus({preventScroll:true}); else actionButton.focus({preventScroll:true}); } },
        destroy() { destroyed = true; document.removeEventListener('keydown', onKey); cancelAnimationFrame(frame); }
    };
}
