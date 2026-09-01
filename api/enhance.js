const MAX_IMAGE_BYTES = 14 * 1024 * 1024;
const POLL_LIMIT = 45;
const POLL_DELAY = 2000;

// The frontend sends a base64 image payload. Vercel's default body-parser limit
// is smaller than a practical image payload, so keep this explicit and bounded.
export const config = {
  api: {
    bodyParser: { sizeLimit: "15mb" }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { image, scale = 4, faceEnhance = false } = req.body || {};
  if (!isValidImage(image)) return res.status(400).json({ error: "Provide a JPG, PNG, or WebP image under 14 MB." });
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ error: "Image enhancement is not configured on this deployment." });
  const requestedScale = Number(scale);
  const safeScale = [2, 4].includes(requestedScale) ? requestedScale : 4;
  try {
    let prediction = await replicate("https://api.replicate.com/v1/models/nightmareai/real-esrgan/predictions", token, { method: "POST", body: JSON.stringify({ input: { image, scale: safeScale, face_enhance: Boolean(faceEnhance) } }) });
    for (let attempt = 0; attempt <= POLL_LIMIT; attempt += 1) {
      if (prediction.status === "succeeded") {
        const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        if (typeof output !== "string" || !/^https:\/\//.test(output)) return res.status(502).json({ error: "The enhancement provider returned an invalid image." });
        // Keep `output` for compatibility with existing clients and expose a
        // descriptive field so the browser has one unambiguous image URL.
        return res.status(200).json({ success: true, output, imageUrl: output, scale: safeScale });
      }
      if (["failed", "canceled"].includes(prediction.status)) return res.status(502).json({ error: prediction.error || "AI enhancement failed." });
      if (!prediction.id || attempt === POLL_LIMIT) return res.status(504).json({ error: "AI processing timed out. Please try again." });
      await sleep(POLL_DELAY);
      prediction = await replicate(`https://api.replicate.com/v1/predictions/${prediction.id}`, token);
    }
  } catch (error) {
    console.error("Replicate enhancement error:", error.message);
    return res.status(502).json({ error: "The image enhancement service is temporarily unavailable." });
  }
}

function isValidImage(image) {
  if (typeof image !== "string" || image.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 128) return false;
  return /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(image);
}

async function replicate(url, token, options = {}) {
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait=10", ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || payload.error || `Replicate request failed (${response.status})`);
  return payload;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
