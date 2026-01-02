import express from "express";
import { encodeUrl, decodeUrl } from "../utils/token.js";
import { request } from "undici";
import { pipeline } from "node:stream/promises";

const router = express.Router();

// Encode endpoint
router.post("/encode", (req, res) => {
  const { links } = req.body;
  if (!Array.isArray(links)) {
    return res.status(400).json({ error: "links must be an array" });
  }
  console.log("Encoding links:", links);
  try {
    const encoded = links.map(({ quality, url }) => ({
      quality,
      token: encodeUrl(url),
    }));
    console.log("Encoded links:", encoded);
    res.json({ links: encoded });
  } catch (err) {
    res.status(500).json({ error: "Failed to encode links" });
  }
});

// Proxy download endpoint
router.get("/download/:token", async (req, res) => {
  let decoded;
  try {
    decoded = decodeUrl(req.params.token);
    console.log("token:", req.params.token);
    console.log("decoded:", decoded);
  } catch (err) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const url = decoded.url;

  if (typeof url !== "string" || !url.match(/^https?:\/\//i)) {
    console.error("❌ Invalid upstream URL:", url);
    return res.status(400).json({ error: "Invalid upstream URL" });
  }

  try {
    const upstream = await request(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        referer: "https://kwik.cx/",
      },
    });

    // Set appropriate headers for streaming
    if (upstream.headers["content-type"]) {
      res.setHeader("Content-Type", upstream.headers["content-type"]);
    }
    if (upstream.headers["content-length"]) {
      res.setHeader("Content-Length", upstream.headers["content-length"]);
    }
    if (upstream.headers["content-disposition"]) {
      res.setHeader(
        "Content-Disposition",
        upstream.headers["content-disposition"]
      );
    }

    // Pipe upstream stream to client
    await pipeline(upstream.body, res);
  } catch (err) {
    console.error("Upstream fetch failed:", err);
    return res.status(502).json({
      error: "Failed to fetch upstream",
      details: err.message,
      cause: err.cause ? err.cause.code || err.cause.message : undefined,
    });
  }
});

export default router;
