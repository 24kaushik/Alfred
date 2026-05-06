import { createAgent, SystemMessage } from "langchain";
import { GPTOSS_120B } from "../config/models.config";
import RetrieveQuestionPapersTool from "../tools/rag/qp.tool";
import {
  GetAllSubjectsIDTool,
  GetSyllabusTool,
} from "../tools/erp/getSyllabus.tool";
import { ChatRagTool } from "../tools/rag/chatRag.tool";

const StudyHelpAgent = createAgent({
  model: GPTOSS_120B,
  tools: [RetrieveQuestionPapersTool, GetAllSubjectsIDTool, GetSyllabusTool, ChatRagTool],
  systemPrompt: "You are a helpful assistant for students preparing for their exams. You can retrieve question papers, provide syllabus information, and access content from files uploaded by the user in this chat. If user asks some question, try to find the answer from the uploaded files first and then from your own knowledge. Always use the tools at your disposal to get the most accurate and relevant information for the user.",
});

export default StudyHelpAgent;
