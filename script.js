/* ==========================================
   PROFESSIONAL BATIK VECTORIZE
========================================== */

function vectorizeImage() {

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
            "Vector engine failed to load."
        );

        engineStatus.textContent =
            "ENGINE LOAD ERROR";

        return;
    }


    vectorizeButton.disabled = true;

    vectorizeButton.textContent =
        "PROCESSING...";

    processingNote.textContent =
        "Cleaning and tracing Batik artwork...";

    engineStatus.textContent =
        "PROCESSING";


    setTimeout(() => {

        try {

            const canvas =
                document.createElement(
                    "canvas"
                );

            const ctx =
                canvas.getContext(
                    "2d",
                    {
                        willReadFrequently:
                            true
                    }
                );


            /*
               Higher resolution tracing.
               Better for Batik details.
            */

            const detailLevel =
                Number(
                    detail.value
                );


            const maxDimension =
                detailLevel >= 8
                    ? 2200
                    : 1800;


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


            canvas.width =
                width;

            canvas.height =
                height;


            /*
               High-quality resize
            */

            ctx.imageSmoothingEnabled =
                true;

            ctx.imageSmoothingQuality =
                "high";


            ctx.drawImage(
                sourceImage,
                0,
                0,
                width,
                height
            );


            let imageData =
                ctx.getImageData(
                    0,
                    0,
                    width,
                    height
                );


            /*
               STEP 1
               Convert to smooth grayscale
            */

            imageData =
                createSmoothMonochrome(
                    imageData,
                    Number(
                        threshold.value
                    ),
                    detailLevel,
                    invert.checked
                );


            /*
               STEP 2
               Remove tiny isolated pixels
            */

            imageData =
                cleanBinaryNoise(
                    imageData,
                    width,
                    height,
                    detailLevel
                );


            /*
               STEP 3
               Smooth vector tracing
            */

            const traceTolerance =
                getTraceTolerance(
                    detailLevel
                );


            const pathOmit =
                detailLevel >= 8
                    ? 1
                    : detailLevel >= 6
                        ? 2
                        : 3;


            const options = {

                numberofcolors:
                    2,

                colorsampling:
                    0,

                colorquantcycles:
                    1,

                ltres:
                    traceTolerance,

                qtres:
                    traceTolerance,

                pathomit:
                    pathOmit,

                /*
                   Important:
                   false = less forced
                   square/angular corners
                */

                rightangleenhance:
                    false,

                linefilter:
                    false,

                strokewidth:
                    0,

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


            const svg =
                vectorPreview.querySelector(
                    "svg"
                );


            if (svg) {

                svg.setAttribute(
                    "preserveAspectRatio",
                    "xMidYMid meet"
                );

                svg.style.width =
                    "100%";

                svg.style.height =
                    "100%";

            }


            downloadSvg.disabled =
                false;

            downloadPng.disabled =
                false;


            processingNote.textContent =
                "Clean Batik vector created successfully.";


            engineStatus.textContent =
                "VECTOR ENGINE READY";


            showToast(
                "Smooth Batik vector created."
            );

        }

        catch (error) {

            console.error(
                error
            );


            processingNote.textContent =
                "Vector conversion failed.";


            engineStatus.textContent =
                "ENGINE ERROR";


            showToast(
                "Vector conversion failed."
            );

        }

        finally {

            vectorizeButton.disabled =
                false;


            vectorizeButton.textContent =
                "✦ CREATE VECTOR ARTWORK →";

        }

    }, 100);

}
/* ==========================================
   SMOOTH MONOCHROME PREPROCESSING
========================================== */

function createSmoothMonochrome(
    imageData,
    thresholdValue,
    detailLevel,
    shouldInvert
) {

    const data =
        imageData.data;

    const width =
        imageData.width;

    const height =
        imageData.height;


    const gray =
        new Float32Array(
            width * height
        );


    /*
       Convert RGB → luminance
    */

    for (
        let i = 0,
            p = 0;
        i < data.length;
        i += 4,
            p++
    ) {

        gray[p] =
            (
                data[i] *
                0.299
            ) +
            (
                data[i + 1] *
                0.587
            ) +
            (
                data[i + 2] *
                0.114
            );

    }


    /*
       Small blur.
       Lower detail = more smoothing.
    */

    let passes =
        detailLevel <= 4
            ? 2
            : 1;


    let current =
        gray;


    for (
        let pass = 0;
        pass < passes;
        pass++
    ) {

        current =
            blurGray(
                current,
                width,
                height
            );

    }


    /*
       Apply threshold
    */

    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const index =
                y * width + x;


            let value =
                current[index] >=
                    thresholdValue
                    ? 255
                    : 0;


            if (
                shouldInvert
            ) {

                value =
                    255 -
                    value;

            }


            const pixel =
                index * 4;


            data[pixel] =
                value;

            data[pixel + 1] =
                value;

            data[pixel + 2] =
                value;

            data[pixel + 3] =
                255;

        }

    }


    return imageData;

}
/* ==========================================
   SMALL BLUR
========================================== */

function blurGray(
    source,
    width,
    height
) {

    const output =
        new Float32Array(
            source.length
        );


    for (
        let y = 1;
        y < height - 1;
        y++
    ) {

        for (
            let x = 1;
            x < width - 1;
            x++
        ) {

            const i =
                y * width + x;


            /*
               Weighted 3x3 blur
            */

            output[i] =
                (
                    source[i] * 4 +

                    source[i - 1] * 2 +
                    source[i + 1] * 2 +

                    source[i - width] * 2 +
                    source[i + width] * 2 +

                    source[
                        i - width - 1
                    ] +

                    source[
                        i - width + 1
                    ] +

                    source[
                        i + width - 1
                    ] +

                    source[
                        i + width + 1
                    ]

                ) / 16;

        }

    }


    return output;

}
/* ==========================================
   REMOVE SMALL PIXEL NOISE
========================================== */

function cleanBinaryNoise(
    imageData,
    width,
    height,
    detailLevel
) {

    const data =
        imageData.data;


    /*
       High detail mode should preserve
       more tiny Batik elements.
    */

    const requiredNeighbors =
        detailLevel >= 8
            ? 2
            : 3;


    const copy =
        new Uint8ClampedArray(
            data
        );


    for (
        let y = 1;
        y < height - 1;
        y++
    ) {

        for (
            let x = 1;
            x < width - 1;
            x++
        ) {

            const index =
                y * width + x;


            const pixel =
                index * 4;


            const current =
                copy[pixel];


            let same =
                0;


            for (
                let dy = -1;
                dy <= 1;
                dy++
            ) {

                for (
                    let dx = -1;
                    dx <= 1;
                    dx++
                ) {

                    if (
                        dx === 0 &&
                        dy === 0
                    ) {
                        continue;
                    }


                    const neighbor =
                        (
                            (
                                y + dy
                            ) *
                            width +
                            (
                                x + dx
                            )
                        ) * 4;


                    if (
                        copy[
                            neighbor
                        ] ===
                        current
                    ) {

                        same++;

                    }

                }

            }


            /*
               Isolated pixel →
               use opposite color.
            */

            if (
                same <
                requiredNeighbors
            ) {

                const value =
                    current === 255
                        ? 0
                        : 255;


                data[pixel] =
                    value;

                data[pixel + 1] =
                    value;

                data[pixel + 2] =
                    value;

            }

        }

    }


    return imageData;

}
/* ==========================================
   VECTOR CURVE QUALITY
========================================== */

function getTraceTolerance(
    detailLevel
) {

    /*
       Lower value =
       closer / more accurate curves.

       But too low can create
       massive SVG files.
    */

    const map = {

        1: 2.4,
        2: 2.1,
        3: 1.8,
        4: 1.5,
        5: 1.25,
        6: 1.05,
        7: 0.85,
        8: 0.65,
        9: 0.48,
        10: 0.35

    };


    return (
        map[
            detailLevel
        ] ||
        1
    );

}
