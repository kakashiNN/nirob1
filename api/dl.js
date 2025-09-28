// api/dl.js
import axios from "axios";

const COOKIE = process.env.CAPCUT_COOKIE || `cf_clearance=a2cHWrcOVE1uZ2AFr866Vc_HStDlwqquTm4ciDrm3j0-1759072994-1.2.1.1-Z5FZ2meDu0389i5Xo7VQiHVK2n300HC1hqaY.5lgvAQfNnhgz.MfcdX9vSwcgjR5W5vvRnsaggo0nmkGgP9h_bLsEkKUVOP5u5FAG_x3d3vCbR0rKMFcvZC4UQ272bZfBExyBubhmh7.Qs.xrV.y_knJFXq5i_X2oaThqbni1ITuNbxV72YVvo8DRTU_5R5u6ezUR4tNZdRU69k4vBXMWQsBL0RSuV7JJfUCGzbvS6I; __gads=ID=7ce4fe270a5f1918:T=1759072991:RT=1759072991:S=ALNI_MbzX3s4aZ3xLsPso1ASRPsMr1ZbzQ; __gpi=UID=0000115ae01dc87e:T=1759072991:RT=1759072991:S=ALNI_Mb7m_osfG4pRm2KyTqR92YSTDMt4Q; __eoi=ID=3320d7315190cf15:T=1759072991:RT=1759072991:S=AA-AfjYpEfYzFQAAJX7NBPgpad0r; FCNEC=%5B%5B%22AKsRol8RMCab6bXpnr038EuspFdjQ_hPdlMQkjHuNgh-xl-mmMUm0jNBlZDxjZDOhlzxSFVSMcrl-4SitMSTC4_pTAEXcQ2ZBxlfODyWiXaWk_t9PIAkk1ZsFy3NuT1I4ifFwidwuiqjvS6bXQsjVGMMlAPtRjT4QQ%3D%3D%22%5D%5D`;

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
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
          "cookie": COOKIE,
        },
        timeout: 120000,
      }
    );

    const data = response.data || {};

    // try different possible fields returned by 3bic
    const candidatePaths = [
      data.originalVideoUrl,
      data.videoUrl,
      data.url,
      data.downloadUrl,
      data.result?.url,
    ];

    let videoUrl = null;
    for (const p of candidatePaths) {
      if (!p) continue;
      // if path looks like relative on 3bic, prefix it
      if (typeof p === "string" && p.startsWith("/")) videoUrl = "https://3bic.com" + p;
      else if (typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"))) videoUrl = p;
      if (videoUrl) break;
    }

    // If still not found, maybe response returned an object with 'data' containing link
    if (!videoUrl && data.data) {
      const maybe = data.data.originalVideoUrl || data.data.videoUrl || data.data.url;
      if (maybe) {
        videoUrl = maybe.startsWith("/") ? "https://3bic.com" + maybe : maybe;
      }
    }

    if (!videoUrl) {
      // return full response for debugging
      console.error("No video URL in response:", data);
      return res.status(500).json({ error: "Failed to obtain video URL from upstream", upstream: data });
    }

    // Redirect to the real video URL (this avoids streaming/timeouts on serverless)
    return res.redirect(videoUrl);
  } catch (err) {
    console.error("❌ Error fetching from 3bic:", err?.response?.status, err?.message || err);
    if (err.response && err.response.data) {
      // forward upstream error for debugging
      return res.status(err.response.status || 500).json({
        error: true,
        status: err.response.status,
        upstream: err.response.data,
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
        }
