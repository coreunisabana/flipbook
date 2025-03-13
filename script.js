document.addEventListener("DOMContentLoaded", function () {
    let pdfDoc = null;
    let totalPages = 0;
    let flipbook = $("#flipbook");

    // Crear overlay y loader
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    const loader = document.createElement('div');
    loader.className = 'loader';
    overlay.appendChild(loader);
    document.body.appendChild(overlay);

    // Configurar los botones de navegación
    $("#prevPage").on('click', function() {
        flipbook.turn('previous');
    });

    $("#nextPage").on('click', function() {
        flipbook.turn('next');
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
            flipbook.turn("previous");
        } else if (event.key === "ArrowRight") {
            flipbook.turn("next");
        }
    });

    // Detectar si es móvil
    const isMobile = window.innerWidth <= 768;

    pdfjsLib.getDocument("src/documento.pdf").promise.then(function (pdf) {
        pdfDoc = pdf;
        totalPages = pdf.numPages;
        loadPages();
    }).catch(function(error) {
        console.error("Error loading PDF:", error);
    });

    function loadPages() {
        let pagesLoaded = 0;
        let pageElements = [];

        for (let i = 1; i <= totalPages; i++) {
            pdfDoc.getPage(i).then(function (page) {
                let canvas = document.createElement("canvas");
                let context = canvas.getContext("2d");
                let viewport = page.getViewport({ scale: isMobile ? 0.8 : 1 }); 

                // Ajustar viewport para móvil
                if (isMobile) {
                    const containerWidth = document.getElementById('flipbook-container').offsetWidth - 40;
                    const scale = containerWidth / viewport.width;
                    viewport = page.getViewport({ scale });
                }

                canvas.width = viewport.width;
                canvas.height = viewport.height;
    
                let renderContext = { canvasContext: context, viewport: viewport };
                page.render(renderContext).promise.then(function () {
                    let div = document.createElement("div");
                    div.classList.add("page");
                    div.appendChild(canvas);
                    
                    pageElements[i-1] = div;
                    pagesLoaded++;
    
                    if (pagesLoaded === totalPages) {
                        // Remover overlay con animación
                        $(overlay).fadeOut(500, function() {
                            overlay.remove();
                            // Agregar páginas al flipbook
                            flipbook.append(...pageElements);

                            // Configuración diferente para móvil y escritorio
                            flipbook.turn({
                                width: isMobile ? viewport.width : viewport.width * 2,
                                height: viewport.height,
                                autoCenter: true,
                                display: isMobile ? 'single' : 'double',
                                acceleration: true,
                                gradients: true,
                                elevation: 50,
                                when: {
                                    turning: function(e, page, view) {
                                        const book = $(this);
                                        book.addClass('animated');
                                        setTimeout(function() {
                                            book.removeClass('animated');
                                        }, 1000);
                                    }
                                }
                            });

                            // Mostrar flipbook con fade in
                            flipbook.css('visibility', 'visible').hide().fadeIn(1000);
                        });
                    }
                });
            });
        }
    }    
});
