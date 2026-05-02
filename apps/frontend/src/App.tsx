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
      <Aapp />
    </div>
  );
}

import { useState } from "react";

function Aapp() {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setOutput("");
    setLoading(true);

    const res = await fetch(
      "http://localhost:6969/api/v1/chat/ecf336ba-b987-4af0-8a6f-76affd09b80c",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRiYzFiNDViLWVlMjMtNDA2NC1hZjMxLTlhMjFhYWYwNGJmZiIsImVtYWlsIjoiYWthdXNoaWthcmthckBnbWFpbC5jb20iLCJpYXQiOjE3Nzc3MjQxMzAsImV4cCI6MTc3ODMyODkzMH0.U2rDpvqJeTQjQm1ASqAxpkN_wKWCuUYeBqdzQ8wDp3w",
        },
        body: JSON.stringify({
          message: "write a story",
          type: "chat",
        }),
      }
    );

    if (!res.body) {
      console.error("Streaming not supported");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const parts = buffer.split("\n\n");
      buffer = parts.pop() as string; // last part might be incomplete, keep it in buffer

      for (const part of parts) {
        if (part.startsWith("data: ")) {
          const data = part.replace("data: ", "");
          setOutput((prev) => prev + data);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>SSE Chat Test</h2>

      <button onClick={sendMessage} disabled={loading}>
        {loading ? "Streaming..." : "Send Message"}
      </button>

      <pre
        style={{
          marginTop: 20,
          padding: 10,
          background: "#111",
          color: "#0f0",
          minHeight: 200,
          whiteSpace: "pre-wrap",
        }}
      >
        {output}
      </pre>
    </div>
  );
}
