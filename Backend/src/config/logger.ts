import morgan from "morgan";
import type { RequestHandler } from "express";

export const httpLogger: RequestHandler = morgan("combined");



