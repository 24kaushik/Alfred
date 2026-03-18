import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.ERP_URL) {
  throw new Error("ERP_URL is not defined in environment variables");
}

const erpClient = axios.create({
  baseURL: process.env.ERP_URL,
});

export default erpClient;
