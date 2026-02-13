import app from "./app";

const PORT = process.env.PORT || 6868;

app.listen(PORT, () => {
  console.log(`ERP Adapter server is running on port ${PORT}`);
});