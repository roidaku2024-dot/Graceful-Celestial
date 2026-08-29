const imageInput = document.getElementById("imageInput");
const originalPreview = document.getElementById("originalPreview");
const vectorPreview = document.getElementById("vectorPreview");
const fileName = document.getElementById("fileName");

const threshold = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");

const detail = document.getElementById("detail");
const detailValue = document.getElementById("detailValue");

const vectorButton = document.getElementById("vectorButton");

const downloadSVG = document.getElementById("downloadSVG");
const downloadEPS = document.getElementById("downloadEPS");


let selectedImage = null;
let generatedSVG = null;


/* =========================
   SLIDERS
========================= */

threshold.addEventListener("input", function () {
    thresholdValue.textContent = threshold.value;
});

detail.addEventListener("input", function () {
    detailValue.textContent = detail.value;
});


/* =========================
   UPLOAD IMAGE
========================= */

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) return;

    selectedImage = file;

    fileName.textContent = file.name;

    const url = URL.createObjectURL(file);

    originalPreview.innerHTML = "";

    const image = document.createElement("img");

    image.src = url;

    originalPreview.appendChild(image);

});


/* =========================
   CREATE VECTOR
========================= */

vectorButton.addEventListener("click", function () {

    if (!selectedImage) {
        alert("Please upload an image first.");
        return;
    }

    vectorButton.disabled = true;
    vectorButton.textContent = "PROCESSING...";

    const reader = new FileReader();

    reader.onload = function (event) {

        const image = new Image();

        image.onload = function () {
            createVector(image);
        };

        image.onerror = function () {
            alert("Image could not be loaded.");
            resetVectorButton();
        };

        image.src = event.target.result;
    };

    reader.readAsDataURL(selectedImage);

});


/* =========================
   STRONG TEXTILE VECTOR
========================= */

function createVector(image) {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", {
        willReadFrequently: true
    });

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    const MAX_SIZE = 900;

    if (width > MAX_SIZE || height > MAX_SIZE) {

        const scale = Math.min(
            MAX_SIZE / width,
            MAX_SIZE / height
        );

        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, width, height);

    const imageData = ctx.getImageData(
        0,
        0,
        width,
        height
    );

    const pixels = imageData.data;

    const thresholdNumber = Number(threshold.value);


    /*
       Convert to strong
       black and white
    */

    for (let i = 0; i < pixels.length; i += 4) {

        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        const gray =
            (0.299 * r) +
            (0.587 * g) +
            (0.114 * b);

        const value =
            gray < thresholdNumber
                ? 0
                : 255;

        pixels[i] = value;
        pixels[i + 1] = value;
        pixels[i + 2] = value;
        pixels[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);


    if (typeof ImageTracer === "undefined") {

        alert(
            "Vector engine did not load. Refresh the website and try again."
        );

        resetVectorButton();
        return;
    }


    /*
       STRONGER VECTOR SETTINGS
    */

    const detailValueNumber = Number(detail.value);

    const options = {

        ltres: Math.max(
            0.5,
            2 - detailValueNumber * 0.12
        ),

        qtres: Math.max(
            0.5,
            2 - detailValueNumber * 0.12
        ),

        pathomit: Math.max(
            2,
            16 - detailValueNumber
        ),

        rightangleenhance: true,

        colorsampling: 0,

        numberofcolors: 2,

        mincolorratio: 0.01,

        colorquantcycles: 1,

        strokewidth: 0,

        linefilter: true,

        roundcoords: 2,

        blurradius: 1,

        blurdelta: 20
    };


    setTimeout(function () {

        try {

            generatedSVG =
                ImageTracer.imagedataToSVG(
                    imageData,
                    options
                );


            vectorPreview.innerHTML = generatedSVG;


            downloadSVG.disabled = false;

            downloadEPS.disabled = false;


            resetVectorButton();

        }

        catch (error) {

            console.error(error);

            alert(
                "Vector failed. Try a lower Detail value such as 3 or 4."
            );

            resetVectorButton();
        }

    }, 100);

}


function resetVectorButton() {

    vectorButton.disabled = false;

    vectorButton.textContent = "CREATE VECTOR";
}


/* =========================
   DOWNLOAD FUNCTION
========================= */

function downloadFile(content, fileName, type) {

    const blob = new Blob(
        [content],
        { type: type }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download = fileName;

    link.style.display = "none";

    document.body.appendChild(link);

    link.click();

    setTimeout(function () {

        URL.revokeObjectURL(url);

        link.remove();

    }, 500);

}


/* =========================
   DOWNLOAD SVG
========================= */

downloadSVG.addEventListener(
    "click",
    function () {

        if (!generatedSVG) {
            alert("Create a vector first.");
            return;
        }

        downloadFile(
            generatedSVG,
            "textile-vector.svg",
            "image/svg+xml;charset=utf-8"
        );

    }
);


/* =========================
   DOWNLOAD EPS
========================= */

downloadEPS.addEventListener(
    "click",
    function () {

        if (!generatedSVG) {
            alert("Create a vector first.");
            return;
        }

        const eps =
            svgToEPS(generatedSVG);

        downloadFile(
            eps,
            "textile-vector.eps",
            "application/postscript"
        );

    }
);


/* =========================
   SVG TO SIMPLE EPS
========================= */

function svgToEPS(svgString) {

    const parser = new DOMParser();

    const doc =
        parser.parseFromString(
            svgString,
            "image/svg+xml"
        );

    const svg =
        doc.querySelector("svg");

    let width =
        parseFloat(svg.getAttribute("width"));

    let height =
        parseFloat(svg.getAttribute("height"));


    /*
       ImageTracer may use
       viewBox instead
    */

    if (!width || !height) {

        const viewBox =
            svg.getAttribute("viewBox");

        if (viewBox) {

            const parts =
                viewBox
                    .trim()
                    .split(/\s+/);

            width = Number(parts[2]);
            height = Number(parts[3]);
        }
    }


    width = width || 1000;
    height = height || 1000;


    let eps =
        "%!PS-Adobe-3.0 EPSF-3.0\n";

    eps +=
        "%%Creator: Graceful Celestial Textile Vector Studio\n";

    eps +=
        "%%BoundingBox: 0 0 " +
        Math.ceil(width) +
        " " +
        Math.ceil(height) +
        "\n";

    eps +=
        "%%EndComments\n";


    const paths =
        svg.querySelectorAll("path");


    paths.forEach(function (path) {

        const d =
            path.getAttribute("d");

        if (!d) return;


        eps += "newpath\n";

        const commands =
            parseSVGPath(d);


        commands.forEach(function (cmd) {

            if (cmd.type === "M") {

                eps +=
                    cmd.x +
                    " " +
                    (height - cmd.y) +
                    " moveto\n";

            }

            else if (cmd.type === "L") {

                eps +=
                    cmd.x +
                    " " +
                    (height - cmd.y) +
                    " lineto\n";

            }

            else if (cmd.type === "C") {

                eps +=
                    cmd.x1 +
                    " " +
                    (height - cmd.y1) +
                    " " +

                    cmd.x2 +
                    " " +
                    (height - cmd.y2) +
                    " " +

                    cmd.x +
                    " " +
                    (height - cmd.y) +
                    " curveto\n";

            }

            else if (cmd.type === "Z") {

                eps += "closepath\n";

            }

        });


        eps +=
            "0 0 0 setrgbcolor\n";

        eps +=
            "fill\n";

    });


    eps +=
        "showpage\n";

    eps +=
        "%%EOF\n";


    return eps;
}


/* =========================
   SVG PATH PARSER
   Supports M L C Z
========================= */

function parseSVGPath(d) {

    const tokens =
        d.match(
            /[MLCZmlcz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g
        );

    if (!tokens) return [];

    const result = [];

    let i = 0;

    let command = "";

    let currentX = 0;
    let currentY = 0;


    while (i < tokens.length) {

        if (/[MLCZmlcz]/.test(tokens[i])) {
            command = tokens[i++];
        }


        if (command === "M") {

            currentX = Number(tokens[i++]);
            currentY = Number(tokens[i++]);

            result.push({
                type: "M",
                x: currentX,
                y: currentY
            });

            command = "L";
        }


        else if (command === "L") {

            currentX = Number(tokens[i++]);
            currentY = Number(tokens[i++]);

            result.push({
                type: "L",
                x: currentX,
                y: currentY
            });
        }


        else if (command === "C") {

            const x1 = Number(tokens[i++]);
            const y1 = Number(tokens[i++]);

            const x2 = Number(tokens[i++]);
            const y2 = Number(tokens[i++]);

            currentX = Number(tokens[i++]);
            currentY = Number(tokens[i++]);

            result.push({
                type: "C",
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                x: currentX,
                y: currentY
            });
        }


        else if (
            command === "Z" ||
            command === "z"
        ) {
