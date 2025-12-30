import fetch from "node-fetch";
import fs from "fs";
import { encode } from "punycode";

const BASE = "http://localhost:4000";

async function testEncodeAndDownload() {
  // 1. Encode
  const encodeRes = await fetch(`${BASE}/encode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      links: [
        {
          quality: "Netflix · 360p (61MB)",
          url: "https://vault-08.uwucdn.top/mp4/08/06/cd4ffc602f1bb98f4d586d1bbe8692b2e78f6a3d8457d3cfe7bc391d090569a7?file=AnimePahe_Shuumatsu_no_Walkure_III_-_01_360p_Netflix.mp4",
        },
      ],
    }),
  });

  const encodeJson = await encodeRes.json();
  console.log("Encode Response:", encodeJson);

  const token = encodeJson.links[0].token;
  console.log("Token:", token);

  // 2. Test download streaming
  const dlRes = await fetch(`${BASE}/download/${token}`);
  console.log("Download status:", dlRes.status);
  console.log("Headers:", dlRes.headers.raw());

  // Write file for manual inspection
  const dest = fs.createWriteStream(
    `${encodeJson.links[0].quality.replace(/[^a-z0-9]/gi, "_")}.mp4`
  );
  dlRes.body.pipe(dest);
  console.log("Downloading to downloaded_file.mp4 ...");
}

testEncodeAndDownload().catch(console.error);
