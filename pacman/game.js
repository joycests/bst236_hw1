// Minimal Pac-Man-ish Valentine variant: grid maze + pellets + ghosts + rose power-up + heart shots

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const TILE = 28; // 20x20 grid => 560px
const W = 20, H = 20;

const hud = {
  score: document.getElementById("score"),
  lives: document.getElementById("lives"),
  power: document.getElementById("power"),
};

const DIRS = {
  left:  {x:-1,y:0},
  right: {x:1,y:0},
  up:    {x:0,y:-1},
  down:  {x:0,y:1},
};

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function eq(a,b){ return a.x===b.x && a.y===b.y; }
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

//
// Maze layout: 0 empty, 1 wall, 2 pellet
// Keep it simple but maze-like
//
function makeMaze(){
  const g = Array.from({length:H}, ()=>Array.from({length:W}, ()=>2));
  // Border walls
  for(let y=0;y<H;y++){ g[y][0]=1; g[y][W-1]=1; }
  for(let x=0;x<W;x++){ g[0][x]=1; g[H-1][x]=1; }

  // Internal walls (hand-authored)
  const walls = [
    // horizontal bars
    ...Array.from({length:16}, (_,i)=>({x:i+2,y:3})),
    ...Array.from({length:16}, (_,i)=>({x:i+2,y:16})),
    ...Array.from({length:10}, (_,i)=>({x:i+5,y:8})),
    ...Array.from({length:10}, (_,i)=>({x:i+5,y:11})),
    // vertical pillars
    ...Array.from({length:6}, (_,i)=>({x:3,y:i+5})),
    ...Array.from({length:6}, (_,i)=>({x:16,y:i+5})),
    ...Array.from({length:6}, (_,i)=>({x:9,y:i+5})),
    ...Array.from({length:6}, (_,i)=>({x:10,y:i+10})),
  ];
  for(const p of walls){
    if(p.x>0 && p.x<W-1 && p.y>0 && p.y<H-1) g[p.y][p.x]=1;
  }

  // Clear some corridors
  const clears = [
    {x:1,y:1},{x:2,y:1},{x:3,y:1},{x:4,y:1},
    {x:15,y:1},{x:16,y:1},{x:17,y:1},{x:18,y:1},
    {x:1,y:18},{x:2,y:18},{x:3,y:18},{x:4,y:18},
    {x:15,y:18},{x:16,y:18},{x:17,y:18},{x:18,y:18},
  ];
  for(const p of clears) g[p.y][p.x]=0;

  // Ensure spawn zone is empty
  for(let y=9;y<=10;y++){
    for(let x=9;x<=10;x++) g[y][x]=0;
  }

  return g;
}

let maze = makeMaze();

function isWall(x,y){
  if(x<0||y<0||x>=W||y>=H) return true;
  return maze[y][x]===1;
}

function countPellets(){
  let c=0;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(maze[y][x]===2) c++;
  return c;
}

const state = {
  score: 0,
  lives: 3,
  pellets: countPellets(),
  running: true,
  win: false,
  powerUntil: 0,
  lastShot: 0,
  rose: null, // {x,y, spawnAt}
};

const pac = {
  pos: {x:1,y:1},
  dir: DIRS.right,
  nextDir: DIRS.right,
};

const ghosts = [
  {pos:{x:18,y:18}, color:"#ff6b6b", spawn:{x:18,y:18}},
  {pos:{x:18,y:1},  color:"#6be6ff", spawn:{x:18,y:1}},
  {pos:{x:1,y:18},  color:"#ffe66b", spawn:{x:1,y:18}},
];

let hearts = []; // {x,y,dir,alive}

function resetPositions(){
  pac.pos = {x:1,y:1};
  pac.dir = DIRS.right;
  pac.nextDir = DIRS.right;
  for(const g of ghosts) g.pos = {...g.spawn};
  hearts = [];
}

function tryPlaceRose(){
  // spawn every ~8-12s if none exists
  const now = performance.now();
  if(state.rose) return;
  if(!state._nextRoseAt) state._nextRoseAt = now + randInt(8000,12000);
  if(now < state._nextRoseAt) return;

  // pick random non-wall tile
  for(let i=0;i<80;i++){
    const x = randInt(1,W-2);
    const y = randInt(1,H-2);
    if(!isWall(x,y) && !(x===pac.pos.x && y===pac.pos.y)){
      state.rose = {x,y,spawnAt:now};
      state._nextRoseAt = now + randInt(12000,18000);
      return;
    }
  }
}

function setPower(ms){
  const now = performance.now();
  state.powerUntil = Math.max(state.powerUntil, now + ms);
}

function powered(){
  return performance.now() < state.powerUntil;
}

function shootHeart(){
  const now = performance.now();
  if(now - state.lastShot < 220) return; // fire rate
  state.lastShot = now;
  hearts.push({x: pac.pos.x, y: pac.pos.y, dir: {...pac.dir}, alive:true});
}

function stepEntity(pos, dir){
  const nx = pos.x + dir.x;
  const ny = pos.y + dir.y;
  if(!isWall(nx,ny)) { pos.x = nx; pos.y = ny; return true; }
  return false;
}

function pickGhostDir(g){
  // simple chase: try directions that reduce manhattan distance
  const options = [DIRS.left, DIRS.right, DIRS.up, DIRS.down];
  const target = pac.pos;

  options.sort((a,b)=>{
    const da = Math.abs((g.pos.x+a.x)-target.x)+Math.abs((g.pos.y+a.y)-target.y);
    const db = Math.abs((g.pos.x+b.x)-target.x)+Math.abs((g.pos.y+b.y)-target.y);
    return da-db;
  });

  for(const d of options){
    if(!isWall(g.pos.x+d.x, g.pos.y+d.y)) return d;
  }
  return DIRS.left;
}

function update(){
  if(!state.running) return;

  tryPlaceRose();

  // Pac movement (grid step every tick)
  // allow turning if nextDir works
  if(!isWall(pac.pos.x + pac.nextDir.x, pac.pos.y + pac.nextDir.y)){
    pac.dir = pac.nextDir;
  }
  stepEntity(pac.pos, pac.dir);

  // Pellet eat
  if(maze[pac.pos.y][pac.pos.x]===2){
    maze[pac.pos.y][pac.pos.x]=0;
    state.score += 10;
    state.pellets -= 1;
    if(state.pellets<=0){
      state.running=false; state.win=true;
    }
  }

  // Rose pickup
  if(state.rose && pac.pos.x===state.rose.x && pac.pos.y===state.rose.y){
    state.rose = null;
    setPower(5000); // 5s
    state.score += 100;
  }

  // Auto-shoot while powered
  if(powered()) shootHeart();

  // Hearts move (faster)
  for(const h of hearts){
    if(!h.alive) continue;
    for(let i=0;i<2;i++){
      const nx = h.x + h.dir.x;
      const ny = h.y + h.dir.y;
      if(isWall(nx,ny)){ h.alive=false; break; }
      h.x=nx; h.y=ny;
      // hit ghost?
      for(const g of ghosts){
        if(g.pos.x===h.x && g.pos.y===h.y){
          h.alive=false;
          g.pos = {...g.spawn};
          state.score += 250;
          break;
        }
      }
      if(!h.alive) break;
    }
  }
  hearts = hearts.filter(h=>h.alive);

  // Ghost movement
  for(const g of ghosts){
    const d = pickGhostDir(g);
    stepEntity(g.pos, d);
  }

  // Collisions
  for(const g of ghosts){
    if(eq(g.pos, pac.pos)){
      state.lives -= 1;
      if(state.lives<=0){
        state.running=false; state.win=false;
      } else {
        resetPositions();
      }
      break;
    }
  }

  hud.score.textContent = `Score: ${state.score}`;
  hud.lives.textContent = `Lives: ${state.lives}`;
  hud.power.textContent = powered() ? `Power: 💕` : `Power: —`;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Maze
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const px=x*TILE, py=y*TILE;
      if(maze[y][x]===1){
        ctx.fillStyle = "rgba(124,92,255,.55)";
        ctx.fillRect(px,py,TILE,TILE);
      } else {
        // floor
        ctx.fillStyle = "rgba(255,255,255,.02)";
        ctx.fillRect(px,py,TILE,TILE);
        // pellet
        if(maze[y][x]===2){
          ctx.fillStyle="rgba(255,255,255,.85)";
          ctx.beginPath();
          ctx.arc(px+TILE/2, py+TILE/2, 3, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
  }

  // Rose
  if(state.rose){
    const px=state.rose.x*TILE, py=state.rose.y*TILE;
    ctx.fillStyle="#ff4fa3";
    ctx.font="18px system-ui";
    ctx.fillText("🌹", px+6, py+20);
  }

  // Hearts
  for(const h of hearts){
    const px=h.x*TILE, py=h.y*TILE;
    ctx.font="18px system-ui";
    ctx.fillText("💕", px+4, py+20);
  }

  // Pac-Man
  {
    const px=pac.pos.x*TILE, py=pac.pos.y*TILE;
    ctx.font="20px system-ui";
    ctx.fillText(powered() ? "😻" : "😙", px+4, py+20);
  }

  // Ghosts
  for(const g of ghosts){
    const px=g.pos.x*TILE, py=g.pos.y*TILE;
    ctx.font="20px system-ui";
    ctx.fillText("👻", px+4, py+20);
  }

  // End overlay
  if(!state.running){
    ctx.fillStyle="rgba(0,0,0,.65)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#fff";
    ctx.font="28px system-ui";
    ctx.textAlign="center";
    ctx.fillText(state.win ? "You Win 💘" : "Game Over 💔", canvas.width/2, canvas.height/2 - 10);
    ctx.font="16px system-ui";
    ctx.fillText("Press R to restart", canvas.width/2, canvas.height/2 + 18);
    ctx.textAlign="left";
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e)=>{
  const k = e.key.toLowerCase();
  if(k==="arrowleft"||k==="a") pac.nextDir = DIRS.left;
  if(k==="arrowright"||k==="d") pac.nextDir = DIRS.right;
  if(k==="arrowup"||k==="w") pac.nextDir = DIRS.up;
  if(k==="arrowdown"||k==="s") pac.nextDir = DIRS.down;

  if(k==="r"){
    maze = makeMaze();
    state.score=0; state.lives=3; state.running=true; state.win=false;
    state.pellets=countPellets();
    state.powerUntil=0; state.rose=null; state._nextRoseAt=0;
    resetPositions();
  }
});

resetPositions();
loop();
