import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import complaintRouter from "./complaint.routes.js";
import syncRouter from "./sync.routes.js";
import { walletRouter } from "./wallet.routes.js";
import { achievementsRouter } from "./achievements.routes.js";
import { gamesRouter } from "./games.routes.js";
import { leaderboardRouter } from "./leaderboard.routes.js";
import { aiRouter } from "./ai.routes.js";
import { matchmakingRouter } from "./matchmaking.routes.js";
import { subscriptionsRouter } from "./subscriptions.routes.js";
import { userRouter } from "./user.routes.js";
import { friendRouter } from "./friend.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/complaints", complaintRouter);
apiRouter.use("/sync", syncRouter);
apiRouter.use("/wallet", walletRouter);
apiRouter.use("/achievements", achievementsRouter);
apiRouter.use("/games", gamesRouter);
apiRouter.use("/leaderboard", leaderboardRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/matchmaking", matchmakingRouter);
apiRouter.use("/subscriptions", subscriptionsRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/friends", friendRouter);

