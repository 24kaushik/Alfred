import { createAgent, SystemMessage } from "langchain";
import { GPTOSS_120B } from "../config/models.config";
import RetrieveQuestionPapersTool from "../tools/rag/qp.tool";
import {
  GetAllSubjectsIDTool,
  GetSyllabusTool,
} from "../tools/erp/getSyllabus.tool";

const StudyHelpAgent = createAgent({
  model: GPTOSS_120B,
  tools: [RetrieveQuestionPapersTool, GetAllSubjectsIDTool, GetSyllabusTool],
});

export default StudyHelpAgent;
