import { createAgent } from "langchain";
import { GPTOSS_120B } from "../config/models.config";
import GetStudentDataTool from "../tools/getStudentData.tool";

const erpAgent = createAgent({
  model: GPTOSS_120B,
  tools: [GetStudentDataTool],
});

export default erpAgent;
