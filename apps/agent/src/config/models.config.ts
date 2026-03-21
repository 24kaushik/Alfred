import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
dotenv.config();

export const GPTOSS_120B = new ChatGroq({
  model: "openai/gpt-oss-120b",
  streaming: true,
});

export const GPTOSS_20B = new ChatGroq({
  model: "openai/gpt-oss-20b",
  streaming: true,
});

export const llama3_8B_INSTANT = new ChatGroq({
  model: "llama-3.1-8b-instant",
  streaming: true,
});