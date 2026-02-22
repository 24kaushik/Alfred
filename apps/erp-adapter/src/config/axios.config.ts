import axios from "axios";

const client = axios.create({
  baseURL: "https://qums.quantumuniversity.edu.in",
});

export default client;