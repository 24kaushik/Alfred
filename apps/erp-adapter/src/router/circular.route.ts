import { Router } from "express";

import { getCirculars } from "../controller/circular.controller";

const circularRouter: Router = Router();

circularRouter.get("/", getCirculars);

export default circularRouter;
