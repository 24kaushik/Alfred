import axios from "axios";

const qumsClient = axios.create({
  baseURL: "https://qums.quantumuniversity.edu.in",
});

export default qumsClient;