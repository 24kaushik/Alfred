import { Router } from "express";
import { getSubjects, getSyllabus } from "../controller/syllabus.controller";
import { body } from "express-validator";

const syllabusRouter: Router = Router();

syllabusRouter.get("/:userID", getSubjects);
syllabusRouter.post(
  "/:userID",
  body("subjectID")
    .isString()
    .notEmpty()
    .withMessage("subjectID is required and must be a non-empty string"),
  getSyllabus,
);

export default syllabusRouter;
