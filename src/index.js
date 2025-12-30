import express from "express";
import cors from "cors";
import downloadRoutes from "./routes/download.js";
import { PORT } from "./config.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) =>
  res.json({ status: "Download proxy service running" })
);

app.use("/", downloadRoutes);

app.listen(PORT, () =>
  console.log(`Download proxy service listening at http://localhost:${PORT}`)
);
