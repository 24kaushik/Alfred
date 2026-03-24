import express, { type Express } from "express";
import erpAgent from "./agent/erp.agent";
import ragAgent from "./agent/rag.agent";

const app: Express = express();
app.use(express.json());

app.post("/", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res
      .status(400)
      .json({ error: "Query is required in the request body." });
  }

  const reply = await ragAgent.invoke({
    messages: [{ role: "user", content: query }],
  });
  return res.json({ ...reply });
});



export default app;
