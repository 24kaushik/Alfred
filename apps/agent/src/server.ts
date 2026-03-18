import app from "./app";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 6767;

app.listen(PORT, () => {
  console.log(`Agent server is running on port ${PORT}`);
});