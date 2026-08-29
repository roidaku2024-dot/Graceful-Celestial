export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      image,
      scale = 4,
      faceEnhance = false
    } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "Image is required"
      });
    }

    const token =
      process.env.REPLICATE_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "REPLICATE_API_TOKEN is missing"
      });
    }

    const createResponse = await fetch(
      "https://api.replicate.com/v1/models/nightmareai/real-esrgan/predictions",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          "Prefer":
            "wait=60"
        },

        body: JSON.stringify({
          input: {
            image: image,
            scale: Number(scale),
            face_enhance:
              Boolean(faceEnhance)
          }
        })
      }
    );

    let prediction =
      await createResponse.json();

    if (!createResponse.ok) {
      return res.status(
        createResponse.status
      ).json({
        error:
          prediction.detail ||
          prediction.error ||
          "Replicate request failed"
      });
    }

    if (
      prediction.status === "succeeded" &&
      prediction.output
    ) {
      return res.status(200).json({
        success: true,
        output: prediction.output
      });
    }

    const maxAttempts = 50;

    for (
      let i = 0;
      i < maxAttempts;
      i++
    ) {
      await sleep(2000);

      const pollResponse =
        await fetch(
          `https://api.replicate.com/v1/predictions/${prediction.id}`,
          {
            headers: {
              "Authorization":
                `Bearer ${token}`
            }
          }
        );

      prediction =
        await pollResponse.json();

      if (
        prediction.status ===
        "succeeded"
      ) {
        return res.status(200).json({
          success: true,
          output: prediction.output
        });
      }

      if (
        prediction.status ===
          "failed" ||
        prediction.status ===
          "canceled"
      ) {
        return res.status(500).json({
          error:
            prediction.error ||
            "AI enhancement failed"
        });
      }
    }

    return res.status(504).json({
      error:
        "AI processing timeout"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        "Server error"
    });
  }
}

function sleep(ms) {
  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );
}
