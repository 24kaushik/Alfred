import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useEffect } from "react";

export default function App() {
  const login = useGoogleLogin({
    flow: "auth-code", // IMPORTANT
    onSuccess: async (codeResponse) => {
      console.log("CODE:", codeResponse.code);

      try {
        const res = await axios.post(
          "http://localhost:6969/api/v1/auth/google", // your backend
          { code: codeResponse.code },
          { withCredentials: true },
        );

        console.log("BACKEND RESPONSE:", res.data);
      } catch (err) {
        console.error("Backend error:", err);
      }
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  useEffect(() => {
    axios
      .get("http://localhost:6969/", { withCredentials: true })
      .then((res) => {
        console.log("Check Auth Response:", res.data);
      })
      .catch((err) => {
        console.error("Check Auth Error:", err);
      });
  }, []);

  return (
    <div style={{ padding: 50 }}>
      <button onClick={() => login()}>Login with Google</button>
    </div>
  );
}
