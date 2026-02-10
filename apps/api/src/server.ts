import express from "express"

const app = express()

app.get("/", (_, res) => res.send("alive"))

app.listen(3000)