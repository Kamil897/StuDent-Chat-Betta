import { prisma } from "../lib/prisma.js";

const GAMES = [
  { id: "PingPong", displayName: "Ping Pong", unlockPrice: 100 },
  { id: "Asteroid", displayName: "Asteroid", unlockPrice: 150 },
  { id: "TicTacToe", displayName: "Tic Tac Toe", unlockPrice: 50 },
  { id: "MineSweeper", displayName: "Minesweeper", unlockPrice: 200 },
  { id: "ArenaShooter", displayName: "Arena Shooter", unlockPrice: 300 },
  { id: "TeleportingCubeGame", displayName: "Teleporting Cube", unlockPrice: 250 },
  { id: "Tir", displayName: "Tir", unlockPrice: 180 },
  { id: "Snake", displayName: "Snake", unlockPrice: 120 },
];

async function seedGames() {
  console.log("Seeding games...");
  
  for (const game of GAMES) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: {
        displayName: game.displayName,
        unlockPrice: game.unlockPrice,
      },
      create: game,
    });
    console.log(`✓ Seeded game: ${game.id}`);
  }
  
  console.log("Games seeded successfully!");
}

seedGames()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


