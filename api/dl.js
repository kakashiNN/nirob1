// api/dl.js
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET" });
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });
  if (!url.includes("capcut")) return res.status(400).json({ error: "Only CapCut URLs allowed" });

  try {
    const response = await axios.post(
      "https://3bic.com/api/download",
      { url },
      {
        headers: {
          "origin": "https://3bic.com",
          "referer": "https://3bic.com/",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
          "cookie": `cf_clearance=a2cHWrcOVE1uZ2AFr866Vc_HStDlwqquTm4ciDrm3j0-1759072994-1.2.1.1-Z5FZ2meDu0389i5Xo7VQiHVK2n300HC1hqaY.5lgvAQfNnhgz.MfcdX9vSwcgjR5W5vvRnsaggo0nmkGgP9h_bLsEkKUVOP5u5FAG_x3d3vCbR0rKMFcvZC4UQ272bZfBExyBubhmh7.Qs.xrV.y_knJFXq5i_X2oaThqbni1ITuNbxV72YVvo8DRTU_5R5u6ezUR4tNZdRU69k4vBXMWQsBL0RSuV7JJfUCGzbvS6I; __gads=ID=7ce4fe270a5f1918:T=1759072991:RT=1759072991:S=ALNI_MbzX3s4aZ3xLsPso1ASRPsMr1ZbzQ; __gpi=UID=0000115ae01dc87e:T=1759072991:RT=1759072991:S=ALNI_Mb7m_osfG4pRm2KyTqR92YSTDMt4Q; __eoi=ID=3320d7315190cf15:T=1759072991:RT=1759072991:S=AA-AfjYpEfYzFQAAJX7NBPgpad0r; FCNEC=%5B%5B%22AKsRol8RMCab6bXpnr038EuspFdjQ_hPdlMQkjHuNgh-xl-mmMUm0jNBlZDxjZDOhlzxSFVSMcrl-4SitMSTC4_pTAEXcQ2ZBxlfODyWiXaWk_t9PIAkk1ZsFy3NuT1I4ifFwidwuiqjvS6bXQsjVGMMlAPtRjT4QQ%3D%3D%22%5D%5D`
        },
        timeout: 120000
      }
    );

    const data = response.data;

    // extract actual video URL
    const urlx = data.originalVideoUrl ? "https://3bic.com" + data.originalVideoUrl : data.videoUrl || data.url;

    if (!urlx) {
      return res.status(500).json({ error: "Failed to get video URL", upstream: data });
    }

    // redirect to the actual video
    return res.redirect(urlx);

  } catch (err) {
    console.error("❌ Error fetching from 3bic:", err?.response?.status, err?.message || err);
    if (err.response && err.response.data) {
      return res.status(err.response.status || 500).json({
        error: true,
        status: err.response.status,
        upstream: err.response.data
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
