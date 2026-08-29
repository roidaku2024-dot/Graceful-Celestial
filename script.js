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
