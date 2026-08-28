const imageInput = document.getElementById("imageInput");

const originalImage =
    document.getElementById("originalImage");

const fileName =
    document.getElementById("fileName");

const vectorButton =
    document.getElementById("vectorButton");

const vectorPreview =
    document.getElementById("vectorPreview");

const downloadSVG =
    document.getElementById("downloadSVG");

const downloadEPS =
    document.getElementById("downloadEPS");

const threshold =
    document.getElementById("threshold");

const thresholdValue =
    document.getElementById("thresholdValue");

const detail =
    document.getElementById("detail");

const detailValue =
    document.getElementById("detailValue");


let selectedImage = null;

let generatedSVG = null;


/* =========================
   THRESHOLD DISPLAY
========================= */

threshold.addEventListener("input", function () {

    thresholdValue.textContent =
        threshold.value;

});


/* =========================
   DETAIL DISPLAY
========================= */

detail.addEventListener("input", function () {

    detailValue.textContent =
        detail.value;

});


/* =========================
   IMAGE UPLOAD
========================= */

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    selectedImage = file;

    fileName.textContent =
        file.name;

    const imageURL =
        URL.createObjectURL(file);

    originalImage.src =
        imageURL;

});


/* =========================
   CREATE VECTOR
========================= */

vectorButton.addEventListener("click", function () {

    if (!selectedImage) {

        alert("Please choose an image first.");

        return;
    }


    vectorButton.disabled = true;

    vectorButton.textContent =
        "Creating Vector...";


    const reader =
        new FileReader();


    reader.onload = function (event) {

        const image =
            new Image();


        image.onload = function () {

            createVector(image);

        };


        image.src =
            event.target.result;

    };


    reader.readAsDataURL(selectedImage);

});


/* =========================
   VECTOR PROCESSING
========================= */

function createVector(image) {

    const canvas =
        document.createElement("canvas");

    const ctx =
        canvas.getContext("2d");


    let width =
        image.width;

    let height =
        image.height;


    /*
       Make the image smaller
       so the browser works faster.
    */

    const maxSize = 1500;


    if (width > maxSize || height > maxSize) {

        const scale =
            Math.min(
                maxSize / width,
                maxSize / height
            );

        width =
            Math.round(width * scale);

        height =
            Math.round(height * scale);

    }


    canvas.width =
        width;

    canvas.height =
        height;


    ctx.drawImage(
        image,
        0,
        0,
        width,
        height
    );


    /*
       Get image pixels
    */

    const imageData =
        ctx.getImageData(
            0,
            0,
            width,
            height
        );


    const pixels =
        imageData.data;


    const thresholdNumber =
        Number(threshold.value);


    /*
       Convert image to black & white
    */

    for (
        let i = 0;
        i < pixels.length;
        i += 4
    ) {

        const r =
            pixels[i];

        const g =
            pixels[i + 1];

        const b =
            pixels[i + 2];


        /*
           Grayscale
        */

        const gray =
            0.299 * r +
            0.587 * g +
            0.114 * b;


        /*
           Black / White
        */

        const value =
            gray < thresholdNumber
                ? 0
                : 255;


        pixels[i] =
            value;

        pixels[i + 1] =
            value;

        pixels[i + 2] =
            value;

    }


    ctx.putImageData(
        imageData,
        0,
        0
    );


    /*
       ImageTracer settings
    */

    const options = {

        ltres: 1,
        qtres: 1,

        pathomit:
            Math.max(
                1,
                10 - Number(detail.value)
            ),

        rightangleenhance: true,

        colorsampling: 0,

        numberofcolors: 2,

        mincolorratio: 0,

        colorquantcycles: 1,

        strokewidth: 1,

        linefilter: true,

        roundcoords: 1,

        blurradius: 0,

        blurdelta: 20

    };


    /*
       Convert canvas → Vector SVG
    */

    ImageTracer.imageToSVG(
        canvas,
        function (svgString) {

            generatedSVG =
                svgString;


            /*
               Show SVG
            */

            vectorPreview.innerHTML =
                generatedSVG;


            /*
               Enable buttons
            */

            downloadSVG.disabled =
                false;

            downloadEPS.disabled =
                false;


            vectorButton.disabled =
                false;

            vectorButton.textContent =
                "✨ Create Vector";

        },
        options
    );

}


/* =========================
   DOWNLOAD SVG
========================= */

downloadSVG.addEventListener(
    "click",
    function () {

        if (!generatedSVG) {
            return;
        }


        const blob =
            new Blob(
                [generatedSVG],
                {
                    type: "image/svg+xml"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            url;

        link.download =
            "textile-vector.svg";


        link.click();


        URL.revokeObjectURL(url);

    }
);


/* =========================
   SVG → EPS
========================= */

downloadEPS.addEventListener(
    "click",
    function () {

        if (!generatedSVG) {
            return;
        }


        const eps =
            svgToEPS(generatedSVG);


        const blob =
            new Blob(
                [eps],
                {
                    type: "application/postscript"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            url;

        link.download =
            "textile-vector.eps";


        link.click();


        URL.revokeObjectURL(url);

    }
);


/* =========================
   SVG PATH → EPS
========================= */

function svgToEPS(svg) {

    const parser =
        new DOMParser();


    const doc =
        parser.parseFromString(
            svg,
            "image/svg+xml"
        );


    const svgElement =
        doc.querySelector("svg");


    const width =
        parseFloat(
            svgElement.getAttribute("width")
        ) || 1000;


    const height =
        parseFloat(
            svgElement.getAttribute("height")
        ) || 1000;


    let eps = "";


    eps +=
        "%!PS-Adobe-3.0 EPSF-3.0\n";


    eps +=
        "%%BoundingBox: 0 0 "
        + Math.ceil(width)
        + " "
        + Math.ceil(height)
        + "\n";


    eps +=
        "%%Creator: Graceful Celestial Textile Vectorizer\n";


    eps +=
        "1 setlinejoin\n";


    eps +=
        "1 setlinecap\n";


    const paths =
        svgElement.querySelectorAll("path");


    paths.forEach(function (path) {

        const d =
            path.getAttribute("d");


        if (!d) {
            return;
        }


        eps +=
            "newpath\n";


        const commands =
            parseSVGPath(d);


        commands.forEach(function (command) {

            if (command.type === "M") {

                eps +=
                    command.x +
                    " " +
                    (height - command.y) +
                    " moveto\n";

            }


            else if (command.type === "L") {

                eps +=
                    command.x +
                    " " +
                    (height - command.y) +
                    " lineto\n";

            }


            else if (command.type === "C") {

                eps +=
                    command.x1 +
                    " " +
                    (height - command.y1) +
                    " " +
                    command.x2 +
                    " " +
                    (height - command.y2) +
                    " " +
                    command.x +
                    " " +
                    (height - command.y) +
                    " curveto\n";

            }


            else if (command.type === "Z") {

                eps +=
                    "closepath\n";

            }

        });


        /*
           Fill black
        */

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
   SIMPLE SVG PATH PARSER
========================= */

function parseSVGPath(d) {

    const tokens =
        d.match(
            /[a-zA-Z]|-?\d*\.?\d+/g
        );


    const result = [];

    let i = 0;

    let currentX = 0;

    let currentY = 0;


    while (i < tokens.length) {

        const command =
            tokens[i++];


        if (command === "M") {

            currentX =
                Number(tokens[i++]);

            currentY =
                Number(tokens[i++]);


            result.push({
                type: "M",
                x: currentX,
                y: currentY
            });

        }


        else if (command === "L") {

            currentX =
                Number(tokens[i++]);

            currentY =
                Number(tokens[i++]);


            result.push({
                type: "L",
                x: currentX,
                y: currentY
            });

        }


        else if (command === "C") {

            const x1 =
                Number(tokens[i++]);

            const y1 =
                Number(tokens[i++]);

            const x2 =
                Number(tokens[i++]);

            const y2 =
                Number(tokens[i++]);

            currentX =
                Number(tokens[i++]);

            currentY =
                Number(tokens[i++]);


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


        else if (command === "Z" ||
                 command === "z") {

            result.push({
                type: "Z"
            });

        }


        else {

            /*
               Skip unsupported commands
            */

            i++;

        }

    }


    return result;

}
