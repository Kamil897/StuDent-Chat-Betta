import { Router } from "express";
import { walletController } from "../controllers/WalletController.js";

export const walletRouter = Router();

// Для совместимости с текущим frontend кошелёк работает и без авторизации.
// Если пользователь авторизован (через будущий Authorization заголовок),
// контроллер использует его id; иначе возвращаются безопасные дефолтные значения.
walletRouter.get("/", (req, res, next) =>
  walletController.getWallet(req, res, next),
);

walletRouter.get("/transactions", (req, res, next) =>
  walletController.getTransactions(req, res, next),
);

// Начисление за победу в игре логично делать только для авторизованных,
// поэтому внутри контроллера есть проверка на req.user.
walletRouter.post("/game-win", (req, res, next) =>
  walletController.awardGameWin(req, res, next),
);


