const imageInput = document.getElementById("imageInput");
const uploadZone = document.getElementById("uploadZone");

const originalPreview = document.getElementById("originalPreview");
const vectorPreview = document.getElementById("vectorPreview");

const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

const threshold = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");

const detail = document.getElementById("detail");
const detailValue = document.getElementById("detailValue");

const invert = document.getElementById("invert");

const vectorizeButton = document.getElementById("vectorizeButton");
const resetButton = document.getElementById("resetButton");

const downloadSvg = document.getElementById("downloadSvg");
const downloadPng = document.getElementById("downloadPng");

const processingNote = document.getElementById("processingNote");
const engineStatus = document.getElementById("engineStatus");

const toast = document.getElementById("toast");

let sourceImage = null;
let sourceFileName = "vector-artwork";
let svgOutput = "";

threshold.addEventListener("input", () => {
  thresholdValue.textContent = threshold.value;
});

detail.addEventListener("input", () => {
  detailValue.textContent = detail.value;
});

uploadZone.addEventListener("click", () => {
  imageInput.click();
});

uploadZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    imageInput.click();
  }
});

imageInput.addEventListener("change", () => {
  if (!imageInput.files.length) return;

  loadFile(imageInput.files[0]);
});

uploadZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  uploadZone.classList.add("dragging");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("dragging");
});

uploadZone.addEventListener("drop", (event) => {
  event.preventDefault();

  uploadZone.classList.remove("dragging");

  const files = event.dataTransfer.files;

  if (!files.length) return;

  loadFile(files[0]);
});

function loadFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file.");
    return;
  }

  const maxSize = 15 * 1024 * 1024;

  if (file.size > maxSize) {
    showToast("Image is too large. Maximum 15 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    const image = new Image();

    image.onload = function () {
      sourceImage = image;
      sourceFileName = removeExtension(file.name);

      originalPreview.innerHTML = "";

      const previewImage = document.createElement("img");

      previewImage.src = event.target.result;
      previewImage.alt = "Original uploaded artwork";

      originalPreview.appendChild(previewImage);

      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);

      vectorizeButton.disabled = false;

      clearVector();

      showToast("Image loaded successfully.");
    };

    image.onerror = function () {
      showToast("Unable to load this image.");
    };

    image.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

vectorizeButton.addEventListener("click", vectorizeImage);

function vectorizeImage() {
  if (!sourceImage) {
    showToast("Please upload an image first.");
    return;
  }

  if (typeof ImageTracer === "undefined") {
    showToast(
      "Vector engine failed to load. Check your internet connection."
    );

    engineStatus.textContent = "ENGINE LOAD ERROR";
    return;
  }

  vectorizeButton.disabled = true;
  vectorizeButton.textContent = "PROCESSING...";

  processingNote.textContent =
    "Creating vector paths. Please wait...";

  engineStatus.textContent = "PROCESSING";

  setTimeout(() => {
    try {
      const canvas = document.createElement("canvas");

      const ctx = canvas.getContext("2d", {
        willReadFrequently: true,
      });

      const maxDimension = 1200;

      let width = sourceImage.naturalWidth;
      let height = sourceImage.naturalHeight;

      if (width > maxDimension || height > maxDimension) {
        const scale = Math.min(
          maxDimension / width,
          maxDimension / height
        );

        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(sourceImage, 0, 0, width, height);

      const imageData = ctx.getImageData(
        0,
        0,
        width,
        height
      );

      const data = imageData.data;

      const limit = Number(threshold.value);
      const shouldInvert = invert.checked;

      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        const gray =
          red * 0.299 +
          green * 0.587 +
          blue * 0.114;

        let value = gray >= limit ? 255 : 0;

        if (shouldInvert) {
          value = 255 - value;
        }

        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }

      const detailLevel = Number(detail.value);

      const traceTolerance = Math.max(
        0.15,
        2.2 - detailLevel * 0.18
      );

      const omit = Math.max(
        1,
        12 - detailLevel
      );

      const options = {
        numberofcolors: 2,
        colorsampling: 0,

        ltres: traceTolerance,
        qtres: traceTolerance,

        pathomit: omit,

        rightangleenhance: true,

        strokewidth: 0,
        linefilter: true,

        scale: 1,
        viewbox: true,

        desc: false,
      };

      svgOutput = ImageTracer.imagedataToSVG(
        imageData,
        options
      );

      vectorPreview.innerHTML = svgOutput;

      const svg =
        vectorPreview.querySelector("svg");

      if (svg) {
        svg.setAttribute(
          "preserveAspectRatio",
          "xMidYMid meet"
        );
      }

      downloadSvg.disabled = false;
      downloadPng.disabled = false;

      processingNote.textContent =
        "Vector artwork created successfully.";

      engineStatus.textContent =
        "VECTOR ENGINE READY";

      showToast("Vector artwork created.");
    } catch (error) {
      console.error(error);

      processingNote.textContent =
        "Vector conversion failed.";

      engineStatus.textContent =
        "ENGINE ERROR";

      showToast(
        "Vector conversion failed. Try another image."
      );
    } finally {
      vectorizeButton.disabled = false;

      vectorizeButton.textContent =
        "✦ CREATE VECTOR ARTWORK →";
    }
  }, 80);
}

downloadSvg.addEventListener("click", () => {
  if (!svgOutput) return;

  const blob = new Blob(
    [svgOutput],
    {
      type: "image/svg+xml;charset=utf-8",
    }
  );

  downloadBlob(
    blob,
    sourceFileName + "-vector.svg"
  );

  showToast("SVG downloaded.");
});

downloadPng.addEventListener("click", () => {
  if (!svgOutput) return;

  const svgBlob = new Blob(
    [svgOutput],
    {
      type: "image/svg+xml;charset=utf-8",
    }
  );

  const svgUrl =
    URL.createObjectURL(svgBlob);

  const image = new Image();

  image.onload = function () {
    const canvas =
      document.createElement("canvas");

    const scale = 2;

    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      function (blob) {
        if (!blob) return;

        downloadBlob(
          blob,
          sourceFileName + "-vector.png"
        );

        showToast("PNG downloaded.");
      },
      "image/png"
    );

    URL.revokeObjectURL(svgUrl);
  };

  image.onerror = function () {
    URL.revokeObjectURL(svgUrl);

    showToast("PNG export failed.");
  };

  image.src = svgUrl;
});

resetButton.addEventListener("click", resetApp);

function resetApp() {
  sourceImage = null;
  svgOutput = "";

  sourceFileName = "vector-artwork";

  imageInput.value = "";

  threshold.value = 128;
  thresholdValue.textContent = "128";

  detail.value = 5;
  detailValue.textContent = "5";

  invert.checked = false;

  originalPreview.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">▧</div>

      <p>
        Upload an image to preview
      </p>
    </div>
  `;

  clearVector();

  fileName.textContent =
    "No image selected";

  fileSize.textContent =
    "🔒 Processed in your browser";

  vectorizeButton.disabled = true;

  processingNote.textContent =
    "Recommended for Batik: Threshold 110–160 · Detail 4–7";

  engineStatus.textContent =
    "VECTOR ENGINE READY";

  showToast("Workspace reset.");
}

function clearVector() {
  svgOutput = "";

  vectorPreview.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">✦</div>

      <p>
        Your vector artwork
        will appear here
      </p>
    </div>
  `;

  downloadSvg.disabled = true;
  downloadPng.disabled = true;
}

function downloadBlob(blob, filename) {
  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function removeExtension(filename) {
  return filename.replace(
    /\.[^/.]+$/,
    ""
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return (
      (bytes / 1024).toFixed(1) +
      " KB"
    );
  }

  return (
    (
      bytes /
      (1024 * 1024)
    ).toFixed(1) +
    " MB"
  );
}

function showToast(message) {
  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

window.addEventListener("load", () => {
  if (typeof ImageTracer === "undefined") {
    engineStatus.textContent =
      "ENGINE LOAD ERROR";

    showToast(
      "Vector engine could not load. Check internet connection."
    );
  }
});

/* ==========================================
   AI ENHANCEMENT HELPERS
========================================== */

async function enhanceImageWithAI(
  imageDataUrl,
  scale = 4,
  faceEnhance = false
) {
  try {
    showToast(
      "AI enhancement started..."
    );

    engineStatus.textContent =
      "AI PROCESSING";

    const response =
      await fetch(
        "/api/enhance",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            image: imageDataUrl,
            scale: scale,
            faceEnhance:
              faceEnhance
          })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        "AI enhancement failed"
      );
    }

    engineStatus.textContent =
      "VECTOR ENGINE READY";

    showToast(
      "AI enhancement complete."
    );

    return result.output;

  } catch (error) {
    console.error(error);

    engineStatus.textContent =
      "AI ERROR";

    showToast(
      error.message
    );

    throw error;
  }
}


/* ==========================================
   SOURCE IMAGE → DATA URL
========================================== */

function getSourceImageDataUrl() {
  if (!sourceImage) {
    return null;
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    sourceImage.naturalWidth;

  canvas.height =
    sourceImage.naturalHeight;

  const ctx =
    canvas.getContext("2d");

  ctx.drawImage(
    sourceImage,
    0,
    0
  );

  return canvas.toDataURL(
    "image/png",
    0.95
  );
}


/* ==========================================
   8K SCALE CALCULATOR
========================================== */

function calculateUpscaleFactor(
  width,
  height
) {
  const targetWidth = 7680;
  const targetHeight = 4320;

  const widthScale =
    targetWidth / width;

  const heightScale =
    targetHeight / height;

  let scale =
    Math.max(
      widthScale,
      heightScale
    );

  scale =
    Math.ceil(scale);

  scale =
    Math.max(
      2,
      scale
    );

  scale =
    Math.min(
      10,
      scale
    );

  return scale;
}


/* ==========================================
   AI 8K ENHANCE
========================================== */

async function run8KEnhance() {
  if (!sourceImage) {
    showToast(
      "Please upload an image first."
    );

    return;
  }

  try {
    processingNote.textContent =
      "AI is enhancing and restoring your image...";

    const scale =
      calculateUpscaleFactor(
        sourceImage.naturalWidth,
        sourceImage.naturalHeight
      );

    const imageDataUrl =
      getSourceImageDataUrl();

    const enhancedUrl =
      await enhanceImageWithAI(
        imageDataUrl,
        scale,
        false
      );

    vectorPreview.innerHTML =
      "";

    const enhancedImage =
      document.createElement(
        "img"
      );

    enhancedImage.src =
      enhancedUrl;

    enhancedImage.alt =
      "AI Enhanced Image";

    vectorPreview.appendChild(
      enhancedImage
    );

    window.aiEnhancedImageUrl =
      enhancedUrl;

    processingNote.textContent =
      "AI enhanced image ready.";

    showToast(
      "AI 8K enhancement finished."
    );

  } catch (error) {
    processingNote.textContent =
      "AI enhancement failed.";
  }
}


/* ==========================================
   DOWNLOAD AI IMAGE
========================================== */

async function downloadAIEnhancedImage() {
  if (
    !window.aiEnhancedImageUrl
  ) {
    showToast(
      "No AI enhanced image yet."
    );

    return;
  }

  try {
    const response =
      await fetch(
        window.aiEnhancedImageUrl
      );

    const blob =
      await response.blob();

    downloadBlob(
      blob,
      sourceFileName +
      "-AI-enhanced.png"
    );

    showToast(
      "Enhanced image downloaded."
    );

  } catch (error) {
    console.error(error);

    showToast(
      "Download failed."
    );
  }
}


/* ==========================================
   ULTRA COLOR VECTOR
========================================== */

function createUltraColorVector(
  colorCount = 16
) {
  if (!sourceImage) {
    showToast(
      "Please upload an image first."
    );

    return;
  }

  if (
    typeof ImageTracer ===
    "undefined"
  ) {
    showToast(
      "Vector engine not loaded."
    );

    return;
  }

  try {
    engineStatus.textContent =
      "COLOR VECTOR PROCESSING";

    processingNote.textContent =
      "Creating ultra color vector...";

    const canvas =
      document.createElement(
        "canvas"
      );

    const maxDimension =
      1600;

    let width =
      sourceImage.naturalWidth;

    let height =
      sourceImage.naturalHeight;

    if (
      width > maxDimension ||
      height > maxDimension
    ) {
      const scale =
        Math.min(
          maxDimension / width,
          maxDimension / height
        );

      width =
        Math.round(
          width * scale
        );

      height =
        Math.round(
          height * scale
        );
    }

    canvas.width = width;
    canvas.height = height;

    const ctx =
      canvas.getContext(
        "2d",
        {
          willReadFrequently:
            true
        }
      );

    ctx.drawImage(
      sourceImage,
      0,
      0,
      width,
      height
    );

    const imageData =
      ctx.getImageData(
        0,
        0,
        width,
        height
      );

    const options = {
      numberofcolors:
        colorCount,

      colorsampling:
        2,

      colorquantcycles:
        3,

      ltres:
        1,

      qtres:
        1,

      pathomit:
        4,

      rightangleenhance:
        true,

      strokewidth:
        0,

      linefilter:
        false,

      scale:
        1,

      viewbox:
        true,

      desc:
        false
    };

    svgOutput =
      ImageTracer.imagedataToSVG(
        imageData,
        options
      );

    vectorPreview.innerHTML =
      svgOutput;

    downloadSvg.disabled =
      false;

    downloadPng.disabled =
      false;

    engineStatus.textContent =
      "VECTOR ENGINE READY";

    processingNote.textContent =
      `${colorCount}-color vector created.`;

    showToast(
      "Ultra Color Vector created."
    );

  } catch (error) {
    console.error(error);

    engineStatus.textContent =
      "VECTOR ERROR";

    showToast(
      "Color vector conversion failed."
    );
  }
}


/* ==========================================
   BATIK AI VECTOR REDRAW
========================================== */

async function runBatikVectorRedraw() {
  if (!sourceImage) {
    showToast(
      "Please upload Batik artwork first."
    );

    return;
  }

  try {
    engineStatus.textContent =
      "BATIK AI PROCESSING";

    processingNote.textContent =
      "Cleaning Batik artwork with AI...";

    const imageDataUrl =
      getSourceImageDataUrl();

    const enhancedUrl =
      await enhanceImageWithAI(
        imageDataUrl,
        2,
        false
      );

    const enhancedImage =
      new Image();

    enhancedImage.crossOrigin =
      "anonymous";

    enhancedImage.onload =
      function () {
        sourceImage =
          enhancedImage;

        processingNote.textContent =
          "AI cleanup complete. Creating Batik vector...";

        vectorizeImage();
      };

    enhancedImage.onerror =
      function () {
        showToast(
          "Unable to load AI enhanced Batik."
        );
      };

    enhancedImage.src =
      enhancedUrl;

  } catch (error) {
    console.error(error);

    engineStatus.textContent =
      "BATIK AI ERROR";

    processingNote.textContent =
      "Batik redraw failed.";

    showToast(
      "Batik redraw failed."
    );
  }
}


/* ==========================================
   TOOL MODE SELECTOR
========================================== */

const toolButtons =
  document.querySelectorAll(
    ".tool-mode"
  );

let currentTool = "bw";

toolButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        toolButtons.forEach(
          (item) => {
            item.classList.remove(
              "active"
            );
          }
        );

        button.classList.add(
          "active"
        );

        currentTool =
          button.dataset.tool;

        changeToolMode(
          currentTool
        );
      }
    );
  }
);


function changeToolMode(mode) {
  if (mode === "bw") {
    processingNote.textContent =
      "Classic Vector Mode selected.";

    showToast(
      "Classic Vector selected."
    );
  }

  else if (
    mode === "color"
  ) {
    processingNote.textContent =
      "Ultra Color Vector Mode selected.";

    showToast(
      "Ultra Color Vector selected."
    );
  }

  else if (
    mode === "8k"
  ) {
    processingNote.textContent =
      "AI 8K Photo Enhance Mode selected.";

    showToast(
      "AI 8K Enhance selected."
    );
  }

  else if (
    mode === "batik"
  ) {
    processingNote.textContent =
      "Batik Vector Redraw Mode selected.";

    showToast(
      "Batik Vector Redraw selected."
    );
  }
}


/* ==========================================
   RUN SELECTED TOOL
========================================== */

function runSelectedTool() {
  if (currentTool === "bw") {
    vectorizeImage();
  }

  else if (
    currentTool === "color"
  ) {
    createUltraColorVector(
      16
    );
  }

  else if (
    currentTool === "8k"
  ) {
    run8KEnhance();
  }

  else if (
    currentTool === "batik"
  ) {
    runBatikVectorRedraw();
  }
}
/* ==========================================
   ADVANCED WORKFLOW BUTTONS
========================================== */

const toolModes =
    document.querySelectorAll(".tool-mode");

const runSelectedTool =
    document.getElementById("runSelectedTool");

const downloadAIImage =
    document.getElementById("downloadAIImage");


let selectedTool = "bw";


/* ------------------------------------------
   SELECT TOOL
------------------------------------------ */

toolModes.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            /* Remove active from all buttons */

            toolModes.forEach(function (item) {

                item.classList.remove("active");

            });


            /* Add active to clicked button */

            button.classList.add("active");


            /* Save selected tool */

            selectedTool =
                button.dataset.tool;


            /* Show message */

            if (selectedTool === "bw") {

                showToast(
                    "Classic Vector selected."
                );

            }

            else if (selectedTool === "color") {

                showToast(
                    "Ultra Color Vector selected."
                );

            }

            else if (selectedTool === "8k") {

                showToast(
                    "AI 8K Enhance selected."
                );

            }

            else if (selectedTool === "batik") {

                showToast(
                    "Batik Vector Redraw selected."
                );

            }

        }
    );

});


/* ------------------------------------------
   RUN SELECTED TOOL
------------------------------------------ */

runSelectedTool.addEventListener(
    "click",
    function () {

        /* Check image first */

        if (!sourceImage) {

            showToast(
                "Please upload an image first."
            );

            return;

        }


        /* CLASSIC VECTOR */

        if (selectedTool === "bw") {

            vectorizeImage();

        }


        /* ULTRA COLOR VECTOR */

        else if (selectedTool === "color") {

            if (
                typeof createUltraColorVector ===
                "function"
            ) {

                createUltraColorVector();

            }

            else {

                showToast(
                    "Ultra Color Vector is not ready yet."
                );

            }

        }


        /* AI 8K ENHANCE */

        else if (selectedTool === "8k") {

            if (
                typeof run8KEnhance ===
                "function"
            ) {

                run8KEnhance();

            }

            else {

                showToast(
                    "AI 8K Enhance is not ready yet."
                );

            }

        }


        /* BATIK VECTOR REDRAW */

        else if (selectedTool === "batik") {

            if (
                typeof runBatikVectorRedraw ===
                "function"
            ) {

                runBatikVectorRedraw();

            }

            else {

                /*
                   Temporary fallback:
                   Use classic vector engine
                */

                processingNote.textContent =
                    "Batik mode: creating clean vector artwork...";


                vectorizeImage();

            }

        }

    }
);


/* ------------------------------------------
   DOWNLOAD AI IMAGE
------------------------------------------ */

downloadAIImage.addEventListener(
    "click",
    function () {

        if (
            typeof downloadAIEnhancedImage ===
            "function"
        ) {

            downloadAIEnhancedImage();

        }

        else {

            showToast(
                "No AI enhanced image available."
            );

        }

    }
);
