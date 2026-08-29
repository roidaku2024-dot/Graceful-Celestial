<script>

    /* ==========================================
       ELEMENTS
    ========================================== */

    const imageInput =
        document.getElementById("imageInput");

    const uploadZone =
        document.getElementById("uploadZone");

    const originalPreview =
        document.getElementById("originalPreview");

    const vectorPreview =
        document.getElementById("vectorPreview");

    const fileName =
        document.getElementById("fileName");

    const fileSize =
        document.getElementById("fileSize");

    const threshold =
        document.getElementById("threshold");

    const thresholdValue =
        document.getElementById("thresholdValue");

    const detail =
        document.getElementById("detail");

    const detailValue =
        document.getElementById("detailValue");

    const invert =
        document.getElementById("invert");

    const vectorizeButton =
        document.getElementById("vectorizeButton");

    const resetButton =
        document.getElementById("resetButton");

    const downloadSvg =
        document.getElementById("downloadSvg");

    const downloadPng =
        document.getElementById("downloadPng");

    const processingNote =
        document.getElementById("processingNote");

    const engineStatus =
        document.getElementById("engineStatus");

    const toast =
        document.getElementById("toast");


    /* ==========================================
       ADVANCED TOOL ELEMENTS
    ========================================== */

    const toolModes =
        document.querySelectorAll(".tool-mode");

    const runSelectedTool =
        document.getElementById("runSelectedTool");

    const downloadAIImage =
        document.getElementById("downloadAIImage");


    /* ==========================================
       VARIABLES
    ========================================== */

    let sourceImage = null;

    let sourceFile = null;

    let sourceFileName = "vector-artwork";

    let svgOutput = "";

    let selectedTool = "bw";

    let aiImageOutput = "";



    /* ==========================================
       SLIDERS
    ========================================== */

    threshold.addEventListener(
        "input",
        function () {

            thresholdValue.textContent =
                threshold.value;

        }
    );


    detail.addEventListener(
        "input",
        function () {

            detailValue.textContent =
                detail.value;

        }
    );



    /* ==========================================
       TOOL MODE SELECTION
    ========================================== */

    toolModes.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    toolModes.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    selectedTool =
                        button.dataset.tool;


                    let toolName =
                        "Classic Vector";


                    if (
                        selectedTool === "color"
                    ) {

                        toolName =
                            "Ultra Color Vector";

                    }


                    if (
                        selectedTool === "8k"
                    ) {

                        toolName =
                            "AI 8K Enhance";

                    }


                    if (
                        selectedTool === "batik"
                    ) {

                        toolName =
                            "Batik Vector Redraw";

                    }


                    showToast(
                        toolName +
                        " selected."
                    );

                }
            );

        }
    );



    /* ==========================================
       UPLOAD CLICK
    ========================================== */

    uploadZone.addEventListener(
        "click",
        function () {

            imageInput.click();

        }
    );


    uploadZone.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                imageInput.click();

            }

        }
    );


    imageInput.addEventListener(
        "change",
        function () {

            if (!imageInput.files.length) {

                return;

            }


            loadFile(
                imageInput.files[0]
            );

        }
    );



    /* ==========================================
       DRAG AND DROP
    ========================================== */

    uploadZone.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            uploadZone.classList.add(
                "dragging"
            );

        }
    );


    uploadZone.addEventListener(
        "dragleave",
        function () {

            uploadZone.classList.remove(
                "dragging"
            );

        }
    );


    uploadZone.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();

            uploadZone.classList.remove(
                "dragging"
            );


            const files =
                event.dataTransfer.files;


            if (!files.length) {

                return;

            }


            loadFile(
                files[0]
            );

        }
    );



    /* ==========================================
       LOAD IMAGE
    ========================================== */

    function loadFile(file) {

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            showToast(
                "Please select an image file."
            );

            return;

        }


        const maxSize =
            15 * 1024 * 1024;


        if (
            file.size > maxSize
        ) {

            showToast(
                "Image is too large. Maximum 15 MB."
            );

            return;

        }


        sourceFile =
            file;


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                const image =
                    new Image();


                image.onload =
                    function () {

                        sourceImage =
                            image;


                        sourceFileName =
                            removeExtension(
                                file.name
                            );


                        originalPreview.innerHTML =
                            "";


                        const previewImage =
                            document.createElement(
                                "img"
                            );


                        previewImage.src =
                            event.target.result;


                        previewImage.alt =
                            "Original uploaded artwork";


                        originalPreview.appendChild(
                            previewImage
                        );


                        fileName.textContent =
                            file.name;


                        fileSize.textContent =
                            formatFileSize(
                                file.size
                            );


                        vectorizeButton.disabled =
                            false;


                        clearVector();


                        clearAIOutput();


                        showToast(
                            "Image loaded successfully."
                        );

                    };


                image.onerror =
                    function () {

                        showToast(
                            "Unable to load this image."
                        );

                    };


                image.src =
                    event.target.result;

            };


        reader.readAsDataURL(
            file
        );

    }



    /* ==========================================
       RUN SELECTED TOOL
    ========================================== */

    runSelectedTool.addEventListener(
        "click",
        function () {

            if (!sourceImage) {

                showToast(
                    "Please upload an image first."
                );

                return;

            }


            if (
                selectedTool === "bw"
            ) {

                vectorizeImage();

                return;

            }


            if (
                selectedTool === "color"
            ) {

                runColorVector();

                return;

            }


            if (
                selectedTool === "8k"
            ) {

                run8KEnhance();

                return;

            }


            if (
                selectedTool === "batik"
            ) {

                runBatikVector();

                return;

            }

        }
    );



    /* ==========================================
       ① ULTRA COLOR VECTOR API
    ========================================== */

    async function runColorVector() {

        if (!sourceFile) {

            showToast(
                "Please upload an image first."
            );

            return;

        }


        runSelectedTool.disabled =
            true;


        runSelectedTool.textContent =
            "PROCESSING...";


        processingNote.textContent =
            "Ultra Color Vector processing...";


        /*
        ==========================================
        ① PUT YOUR COLOR VECTOR API CODE HERE

        Example:

        const formData = new FormData();

        formData.append(
            "image",
            sourceFile
        );

        const response =
            await fetch(
                "YOUR_COLOR_API_URL",
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            "Bearer YOUR_API_KEY"
                    },
                    body: formData
                }
            );

        const result =
            await response.json();

        aiImageOutput =
            result.imageUrl;

        ==========================================
        */


        try {

            showToast(
                "Color Vector API is ready to connect."
            );

        }

        catch (error) {

            console.error(
                error
            );


            showToast(
                "Color Vector failed."
            );

        }

        finally {

            runSelectedTool.disabled =
                false;


            runSelectedTool.textContent =
                "RUN SELECTED TOOL →";

        }

    }



    /* ==========================================
       ② AI 8K ENHANCE API
    ========================================== */

    async function run8KEnhance() {

        if (!sourceFile) {

            showToast(
                "Please upload an image first."
            );

            return;

        }


        runSelectedTool.disabled =
            true;


        runSelectedTool.textContent =
            "PROCESSING...";


        processingNote.textContent =
            "AI 8K Enhance processing...";


        /*
        ==========================================
        ② PUT YOUR 8K API CODE HERE

        const formData = new FormData();

        formData.append(
            "image",
            sourceFile
        );

        const response =
            await fetch(
                "YOUR_8K_API_URL",
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            "Bearer YOUR_API_KEY"
                    },
                    body: formData
                }
            );

        const result =
            await response.json();

        aiImageOutput =
            result.imageUrl;


        downloadAIImage.disabled =
            false;

        ==========================================
        */


        try {

            showToast(
                "AI 8K API is ready to connect."
            );

        }

        catch (error) {

            console.error(
                error
            );


            showToast(
                "AI 8K Enhance failed."
            );

        }

        finally {

            runSelectedTool.disabled =
                false;


            runSelectedTool.textContent =
                "RUN SELECTED TOOL →";

        }

    }



    /* ==========================================
       ③ BATIK VECTOR API
    ========================================== */

    async function runBatikVector() {

        if (!sourceFile) {

            showToast(
                "Please upload an image first."
            );

            return;

        }


        runSelectedTool.disabled =
            true;


        runSelectedTool.textContent =
            "PROCESSING...";


        processingNote.textContent =
            "Batik Vector Redraw processing...";


        /*
        ==========================================
        ③ PUT YOUR BATIK API CODE HERE

        const formData = new FormData();

        formData.append(
            "image",
            sourceFile
        );

        const response =
            await fetch(
                "YOUR_BATIK_API_URL",
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            "Bearer YOUR_API_KEY"
                    },
                    body: formData
                }
            );

        const result =
            await response.json();

        aiImageOutput =
            result.imageUrl;


        downloadAIImage.disabled =
            false;

        ==========================================
        */


        try {

            showToast(
                "Batik API is ready to connect."
            );

        }

        catch (error) {

            console.error(
                error
            );


            showToast(
                "Batik Vector failed."
            );

        }

        finally {

            runSelectedTool.disabled =
                false;


            runSelectedTool.textContent =
                "RUN SELECTED TOOL →";

        }

    }



    /* ==========================================
       DOWNLOAD AI IMAGE
    ========================================== */

    downloadAIImage.addEventListener(
        "click",
        function () {

            if (!aiImageOutput) {

                showToast(
                    "No AI image available."
                );

                return;

            }


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                aiImageOutput;


            link.download =
                sourceFileName +
                "-ai-result.png";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            showToast(
                "Downloading AI image..."
            );

        }
    );



    /* ==========================================
       VECTORIZE
    ========================================== */

    vectorizeButton.addEventListener(
        "click",
        vectorizeImage
    );


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


        vectorizeButton.disabled =
            true;


        vectorizeButton.textContent =
            "PROCESSING...";


        processingNote.textContent =
            "Creating vector paths. Please wait...";


        engineStatus.textContent =
            "PROCESSING";


        setTimeout(
            function () {

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


                    const maxDimension =
                        1200;


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


                    const data =
                        imageData.data;


                    const limit =
                        Number(
                            threshold.value
                        );


                    const shouldInvert =
                        invert.checked;


                    for (
                        let i = 0;
                        i < data.length;
                        i += 4
                    ) {

                        const red =
                            data[i];


                        const green =
                            data[i + 1];


                        const blue =
                            data[i + 2];


                        const gray =
                            (
                                red * 0.299
                            ) +
                            (
                                green * 0.587
                            ) +
                            (
                                blue * 0.114
                            );


                        let value =
                            gray >= limit
                                ? 255
                                : 0;


                        if (
                            shouldInvert
                        ) {

                            value =
                                255 - value;

                        }


                        data[i] =
                            value;


                        data[i + 1] =
                            value;


                        data[i + 2] =
                            value;


                        data[i + 3] =
                            255;

                    }


                    const detailLevel =
                        Number(
                            detail.value
                        );


                    const traceTolerance =
                        Math.max(
                            0.15,
                            2.2 -
                            (
                                detailLevel *
                                0.18
                            )
                        );


                    const omit =
                        Math.max(
                            1,
                            12 -
                            detailLevel
                        );


                    const options = {

                        numberofcolors:
                            2,

                        colorsampling:
                            0,

                        ltres:
                            traceTolerance,

                        qtres:
                            traceTolerance,

                        pathomit:
                            omit,

                        rightangleenhance:
                            true,

                        strokewidth:
                            0,

                        linefilter:
                            true,

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

                    }


                    downloadSvg.disabled =
                        false;


                    downloadPng.disabled =
                        false;


                    processingNote.textContent =
                        "Vector artwork created successfully.";


                    engineStatus.textContent =
                        "VECTOR ENGINE READY";


                    showToast(
                        "Vector artwork created."
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

            },
            80
        );

    }



    /* ==========================================
       DOWNLOAD SVG
    ========================================== */

    downloadSvg.addEventListener(
        "click",
        function () {

            if (!svgOutput) {

                return;

            }


            const blob =
                new Blob(
                    [svgOutput],
                    {
                        type:
                            "image/svg+xml;charset=utf-8"
                    }
                );


            downloadBlob(
                blob,
                sourceFileName +
                "-vector.svg"
            );


            showToast(
                "SVG downloaded."
            );

        }
    );



    /* ==========================================
       DOWNLOAD PNG
    ========================================== */

    downloadPng.addEventListener(
        "click",
        function () {

            if (!svgOutput) {

                return;

            }


            const svgBlob =
                new Blob(
                    [svgOutput],
                    {
                        type:
                            "image/svg+xml;charset=utf-8"
                    }
                );


            const svgUrl =
                URL.createObjectURL(
                    svgBlob
                );


            const image =
                new Image();


            image.onload =
                function () {

                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    const scale =
                        2;


                    canvas.width =
                        image.width *
                        scale;


                    canvas.height =
                        image.height *
                        scale;


                    const ctx =
                        canvas.getContext(
                            "2d"
                        );


                    ctx.fillStyle =
                        "#ffffff";


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

                            if (!blob) {

                                return;

                            }


                            downloadBlob(
                                blob,
                                sourceFileName +
                                "-vector.png"
                            );


                            showToast(
                                "PNG downloaded."
                            );

                        },
                        "image/png"
                    );


                    URL.revokeObjectURL(
                        svgUrl
                    );

                };


            image.onerror =
                function () {

                    URL.revokeObjectURL(
                        svgUrl
                    );


                    showToast(
                        "PNG export failed."
                    );

                };


            image.src =
                svgUrl;

        }
    );



    /* ==========================================
       RESET
    ========================================== */

    resetButton.addEventListener(
        "click",
        resetApp
    );


    function resetApp() {

        sourceImage =
            null;


        sourceFile =
            null;


        svgOutput =
            "";


        sourceFileName =
            "vector-artwork";


        imageInput.value =
            "";


        threshold.value =
            128;


        thresholdValue.textContent =
            "128";


        detail.value =
            5;


        detailValue.textContent =
            "5";


        invert.checked =
            false;


        originalPreview.innerHTML =
            `
                <div class="empty-state">
                    <div class="empty-icon">
                        ▧
                    </div>

                    <p>
                        Upload an image to preview
                    </p>
                </div>
            `;


        clearVector();


        clearAIOutput();


        fileName.textContent =
            "No image selected";


        fileSize.textContent =
            "🔒 Processed in your browser";


        vectorizeButton.disabled =
            true;


        processingNote.textContent =
            "Recommended for Batik: Threshold 110–160 · Detail 4–7";


        engineStatus.textContent =
            "VECTOR ENGINE READY";


        showToast(
            "Workspace reset."
        );

    }



    /* ==========================================
       CLEAR VECTOR
    ========================================== */

    function clearVector() {

        svgOutput =
            "";


        vectorPreview.innerHTML =
            `
                <div class="empty-state">

                    <div class="empty-icon">
                        ✦
                    </div>

                    <p>
                        Your vector artwork
                        will appear here
                    </p>

                </div>
            `;


        downloadSvg.disabled =
            true;


        downloadPng.disabled =
            true;

    }



    /* ==========================================
       CLEAR AI OUTPUT
    ========================================== */

    function clearAIOutput() {

        aiImageOutput =
            "";


        downloadAIImage.disabled =
            true;

    }



    /* ==========================================
       DOWNLOAD HELPER
    ========================================== */

    function downloadBlob(
        blob,
        filename
    ) {

        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            function () {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );

    }



    /* ==========================================
       REMOVE EXTENSION
    ========================================== */

    function removeExtension(
        filename
    ) {

        return filename.replace(
            /\.[^/.]+$/,
            ""
        );

    }



    /* ==========================================
       FORMAT FILE SIZE
    ========================================== */

    function formatFileSize(
        bytes
    ) {

        if (
            bytes < 1024
        ) {

            return (
                bytes +
                " B"
            );

        }


        if (
            bytes <
            1024 * 1024
        ) {

            return (
                (
                    bytes /
                    1024
                ).toFixed(1)
                +
                " KB"
            );

        }


        return (
            (
                bytes /
                (
                    1024 *
                    1024
                )
            ).toFixed(1)
            +
            " MB"
        );

    }



    /* ==========================================
       TOAST
    ========================================== */

    function showToast(
        message
    ) {

        toast.textContent =
            message;


        toast.classList.add(
            "show"
        );


        clearTimeout(
            showToast.timer
        );


        showToast.timer =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                2500
            );

    }



    /* ==========================================
       ENGINE CHECK
    ========================================== */

    window.addEventListener(
        "load",
        function () {

            if (
                typeof ImageTracer ===
                "undefined"
            ) {

                engineStatus.textContent =
                    "ENGINE LOAD ERROR";


                showToast(
                    "Vector engine could not load."
                );

            }

        }
    );

</script>
