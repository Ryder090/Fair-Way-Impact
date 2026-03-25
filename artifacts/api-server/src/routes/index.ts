import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import scoresRouter from "./scores";
import subscriptionsRouter from "./subscriptions";
import charitiesRouter from "./charities";
import drawsRouter from "./draws";
import winnersRouter from "./winners";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/scores", scoresRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/charities", charitiesRouter);
router.use("/draws", drawsRouter);
router.use("/winners", winnersRouter);
router.use("/admin", adminRouter);

export default router;
