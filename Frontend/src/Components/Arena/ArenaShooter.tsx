import React, { useEffect, useRef, useState } from 'react';
import { handleGameWin } from '../../utils/gameRewards';

/* =======================
   CONSTANTS
======================= */
const ARENA = 500;
const PLAYER_SIZE = 30;
const BULLET_W = 6;
const BULLET_H = 12;

const PLAYER_SPEED = 3;
const BULLET_SPEED = 8;

const MAX_HP = 100;
const DAMAGE = 25;

const FIRE_COOLDOWN = 250;
const RESPAWN_TIME = 2000;
const SAFE_TIME = 1000;

const TICK = 1000 / 60;
const MATCH_TIME = 60_000;

/* =======================
   TYPES
======================= */
type Vec2 = { x: number; y: number };

interface Player {
  id: string;
  room: string;
  pos: Vec2;
  hp: number;
  alive: boolean;
  color: string;
  bot: boolean;
  lastShot: number;
  respawnAt: number | null;
  safeUntil: number;
  kills: number;
  deaths: number;
  dir?: Vec2; // только для ботов
}

interface Bullet {
  id: string;
  owner: string;
  room: string;
  pos: Vec2;
  vel: Vec2;
  alive: boolean;
}

/* =======================
   SERVER CORE
======================= */
class ArenaServer {
  players: Player[] = [];
  bullets: Bullet[] = [];
  subs: (() => void)[] = [];

  startTime = Date.now();
  ended = false;

  subscribe(cb: () => void) {
    this.subs.push(cb);
  }
  emit() {
    this.subs.forEach(s => s());
  }

  connect(p: Player) {
    if (p.bot) {
      // случайное направление движения бота
      const angle = Math.random() * Math.PI * 2;
      p.dir = { x: Math.cos(angle) * 1.5, y: Math.sin(angle) * 1.5 };
    }
    this.players.push(p);
    this.emit();
  }

  move(id: string, dx: number, dy: number) {
    const p = this.players.find(p => p.id === id && p.alive);
    if (!p) return;

    p.pos.x = Math.max(0, Math.min(ARENA - PLAYER_SIZE, p.pos.x + dx));
    p.pos.y = Math.max(0, Math.min(ARENA - PLAYER_SIZE, p.pos.y + dy));
  }

  shoot(id: string) {
    const p = this.players.find(p => p.id === id && p.alive);
    if (!p) return;

    const now = Date.now();
    if (now - p.lastShot < FIRE_COOLDOWN) return;
    p.lastShot = now;

    this.bullets.push({
      id: crypto.randomUUID(),
      owner: id,
      room: p.room,
      pos: {
        x: p.pos.x + PLAYER_SIZE / 2 - BULLET_W / 2,
        y: p.pos.y,
      },
      vel: { x: 0, y: -BULLET_SPEED },
      alive: true,
    });
  }

  private kill(victim: Player, killer?: Player) {
    victim.alive = false;
    victim.hp = 0;
    victim.respawnAt = Date.now() + RESPAWN_TIME;
    victim.deaths++;

    if (killer && killer.id !== victim.id) {
      killer.kills++;
    }
  }

  private respawn(p: Player) {
    p.hp = MAX_HP;
    p.alive = true;
    p.respawnAt = null;
    p.safeUntil = Date.now() + SAFE_TIME;
    p.pos = {
      x: Math.random() * (ARENA - PLAYER_SIZE),
      y: Math.random() * (ARENA - PLAYER_SIZE),
    };
    if (p.bot) {
      const angle = Math.random() * Math.PI * 2;
      p.dir = { x: Math.cos(angle) * 1.5, y: Math.sin(angle) * 1.5 };
    }
  }

  tick() {
    const now = Date.now();

    if (!this.ended && now - this.startTime >= MATCH_TIME) {
      this.ended = true;
    }

    // respawn
    for (const p of this.players) {
      if (!p.alive && p.respawnAt && now >= p.respawnAt) {
        this.respawn(p);
      }
    }

    // move bullets
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.pos.x += b.vel.x;
      b.pos.y += b.vel.y;
    }

    // move bots
    for (const p of this.players) {
      if (p.bot && p.alive && p.dir) {
        p.pos.x += p.dir.x;
        p.pos.y += p.dir.y;

        // отражение от стен
        if (p.pos.x < 0 || p.pos.x > ARENA - PLAYER_SIZE) p.dir.x *= -1;
        if (p.pos.y < 0 || p.pos.y > ARENA - PLAYER_SIZE) p.dir.y *= -1;
      }
    }

    // collisions
    for (const b of this.bullets) {
      if (!b.alive) continue;

      const shooter = this.players.find(p => p.id === b.owner);
      if (!shooter) continue;

      for (const p of this.players) {
        if (
          !p.alive ||
          p.id === shooter.id ||
          p.room !== b.room ||
          now < p.safeUntil
        ) continue;

        const hit =
          Math.abs(p.pos.x + PLAYER_SIZE / 2 - b.pos.x) < PLAYER_SIZE / 2 &&
          Math.abs(p.pos.y + PLAYER_SIZE / 2 - b.pos.y) < PLAYER_SIZE / 2;

        if (hit) {
          p.hp -= DAMAGE;
          b.alive = false;

          if (p.hp <= 0) this.kill(p, shooter);
          break;
        }
      }
    }

    // cleanup bullets
    this.bullets = this.bullets.filter(
      b => b.alive && b.pos.y > -20 && b.pos.y < ARENA + 20
    );

    // cleanup dead player visuals
    this.players = this.players.filter(p => p.alive || !p.alive); // оставляем для respawn

    this.emit();
  }

  getWinner() {
    return [...this.players].sort((a, b) => b.kills - a.kills)[0];
  }
}

const server = new ArenaServer();

/* =======================
   COMPONENT
======================= */
const ArenaShooter: React.FC = () => {
  const [, rerender] = useState(0);
  const keys = useRef<Record<string, boolean>>({});
  const myId = useRef(crypto.randomUUID());
  const room = 'main';

  /* INIT */
  useEffect(() => {
    server.connect({
      id: myId.current,
      room,
      pos: { x: 230, y: 420 },
      hp: MAX_HP,
      alive: true,
      color: '#4ade80',
      bot: false,
      lastShot: 0,
      respawnAt: null,
      safeUntil: Date.now() + SAFE_TIME,
      kills: 0,
      deaths: 0,
    });

    for (let i = 0; i < 3; i++) {
      server.connect({
        id: crypto.randomUUID(),
        room,
        pos: { x: 80 + i * 150, y: 60 },
        hp: MAX_HP,
        alive: true,
        color: '#ef4444',
        bot: true,
        lastShot: 0,
        respawnAt: null,
        safeUntil: Date.now() + SAFE_TIME,
        kills: 0,
        deaths: 0,
      });
    }

    server.subscribe(() => rerender(v => v + 1));
  }, []);

  /* INPUT */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ([' ', 'w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      keys.current[e.key] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  /* GAME LOOP */
  useEffect(() => {
    const loop = setInterval(() => {
      if (server.ended) return;

      let dx = 0, dy = 0;
      if (keys.current['a'] || keys.current['ArrowLeft']) dx -= PLAYER_SPEED;
      if (keys.current['d'] || keys.current['ArrowRight']) dx += PLAYER_SPEED;
      if (keys.current['w'] || keys.current['ArrowUp']) dy -= PLAYER_SPEED;
      if (keys.current['s'] || keys.current['ArrowDown']) dy += PLAYER_SPEED;
      if (keys.current[' ']) server.shoot(myId.current);

      server.move(myId.current, dx, dy);

      // simple bot AI shoot
      for (const p of server.players) {
        if (p.bot && p.alive) {
          const target = server.players.find(pl => pl.id !== p.id && pl.alive);
          if (target && Math.random() < 0.015) {
            p.lastShot = Date.now() - FIRE_COOLDOWN; // сброс cooldown для выстрела
            server.shoot(p.id);
          }
        }
      }

      server.tick();
    }, TICK);

    return () => clearInterval(loop);
  }, []);

  const timeLeft = Math.max(
    0,
    Math.ceil((MATCH_TIME - (Date.now() - server.startTime)) / 1000)
  );

  const winner = server.ended ? server.getWinner() : null;
  
  // Award points when player wins
  useEffect(() => {
    if (winner && winner.id === myId.current) {
      handleGameWin("Arena Shooter");
    }
  }, [winner]);

  return (
    <div style={{ background: '#0b0b0b', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
      <div>
        <h3>Arena Shooter</h3>

        <div style={{ position: 'relative', width: ARENA, height: ARENA, background: '#1e1e1e', borderRadius: 8 }}>
          {server.players.map(p => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: p.pos.x,
                top: p.pos.y,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                background: p.color,
                opacity: p.alive ? 1 : 0, // мёртвые исчезают
                border: p.id === myId.current ? '2px solid #fff' : 'none',
              }}
            />
          ))}

          {server.bullets.map(b => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                left: b.pos.x,
                top: b.pos.y,
                width: BULLET_W,
                height: BULLET_H,
                background: '#fff',
              }}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          ⏱ {timeLeft}s
          {winner && <div>🏆 Winner: {winner.id === myId.current ? 'You' : 'Bot'}</div>}
        </div>
      </div>
    </div>
  );
};

export default ArenaShooter;
