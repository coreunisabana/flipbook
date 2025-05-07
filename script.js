document.addEventListener("DOMContentLoaded", function () {
    let pdfDoc = null;
    let totalPages = 0;
    let flipbook = $("#flipbook");
    let isInitialized = false;
    let currentIsMobile = window.innerWidth <= 768;

    // Configurar el worker de PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    // Crear overlay y loader
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    const loader = document.createElement('div');
    loader.className = 'loader';
    overlay.appendChild(loader);
    document.body.appendChild(overlay);

    // Configurar los botones de navegación después de la inicialización del flipbook
    function initializeNavigation() {
        $("#prevPage").on('click', function() {
            if (isInitialized) {
                flipbook.turn('previous');
                updatePageNumber();
            }
        });

        $("#nextPage").on('click', function() {
            if (isInitialized) {
                flipbook.turn('next');
                updatePageNumber();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (!isInitialized) return;
            
            if (event.key === "ArrowLeft") {
                flipbook.turn("previous");
                updatePageNumber();
            } else if (event.key === "ArrowRight") {
                flipbook.turn("next");
                updatePageNumber();
            }
        });
    }

    function updatePageNumber() {
        if (!isInitialized) return;
        try {
            const currentPage = flipbook.turn('page');
            document.getElementById('currentPage').textContent = currentPage;
        } catch (error) {
            console.error('Error updating page number:', error);
        }
    }

    // Detectar si es móvil
    const isMobile = window.innerWidth <= 768;

    // Asegurarse de que pdfPath está definido
    if (typeof pdfPath === 'undefined') {
        overlay.innerHTML = `<div class="error-message">Error: No se ha especificado la ruta del PDF</div>`;
        return;
    }

    // Usar la ruta del PDF definida en cada página
    pdfjsLib.getDocument({
        url: pdfPath,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/cmaps/',
        cMapPacked: true
    }).promise.then(function (pdf) {
        pdfDoc = pdf;
        totalPages = pdf.numPages;
        return loadPages();
    }).catch(function(error) {
        console.error("Error loading PDF:", error);
        overlay.innerHTML = `<div class="error-message">Error al cargar el PDF: ${error.message}</div>`;
    });

    async function loadPages() {
        const pageElements = new Array(totalPages);
        const loadingPromises = [];

        for (let i = 1; i <= totalPages; i++) {
            loadingPromises.push(
                pdfDoc.getPage(i).then(async function (page) {
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    
                    const pixelRatio = window.devicePixelRatio || 1;
                    const baseScale = isMobile ? 0.35 : 0.65;
                    
                    let viewport = page.getViewport({ scale: baseScale }); 

                    if (isMobile) {
                        const containerWidth = Math.min(
                            document.getElementById('flipbook-container').offsetWidth - 20,
                            window.innerWidth - 20
                        );
                        const scale = (containerWidth / viewport.width) * baseScale;
                        viewport = page.getViewport({ scale });
                    }

                    canvas.width = viewport.width * pixelRatio;
                    canvas.height = viewport.height * pixelRatio;
                    canvas.style.width = viewport.width + "px";
                    canvas.style.height = viewport.height + "px";
                    context.scale(pixelRatio, pixelRatio);
    
                    const renderContext = { 
                        canvasContext: context, 
                        viewport: viewport
                    };

                    await page.render(renderContext).promise;
                    
                    const div = document.createElement("div");
                    div.classList.add("page");
                    div.appendChild(canvas);
                    
                    if (isMobile) {
                        div.style.maxWidth = '100vw';
                        div.style.maxHeight = '100vh';
                    }
                    
                    pageElements[i-1] = div;
                })
            );
        }

        try {
            await Promise.all(loadingPromises);
            
            // Limpiar el contenido existente
            flipbook.empty();
            
            // Agregar páginas al flipbook
            flipbook.append(...pageElements);

            // Calcular dimensiones
            const pageWidth = parseFloat(pageElements[0].firstChild.style.width);
            const pageHeight = parseFloat(pageElements[0].firstChild.style.height);

            // Remover overlay con animación
            $(overlay).fadeOut(500, function() {
                overlay.remove();

                // Inicializar turn.js con las dimensiones calculadas
                const options = {
                    width: isMobile ? pageWidth : pageWidth * 2,
                    height: pageHeight,
                    autoCenter: true,
                    display: isMobile ? 'single' : 'double',
                    acceleration: false,
                    gradients: !isMobile,
                    elevation: 50,
                    when: {
                        turning: function(e, page, view) {
                            updatePageNumber();
                        },
                        turned: function(e, page, view) {
                            updatePageNumber();
                        },
                        start: function(e, pageObject) {
                            if (pageObject.next == 0) {
                                e.preventDefault();
                            }
                        }
                    }
                };

                // Asegurar que las dimensiones sean consistentes
                const container = document.getElementById('flipbook-container');
                if (!isMobile) {
                    container.style.width = (pageWidth * 2) + 'px';
                    container.style.margin = '0 auto';
                }

                // Inicializar flipbook con un pequeño retraso para asegurar que las dimensiones se apliquen correctamente
                setTimeout(() => {
                    flipbook.turn(options);
                    isInitialized = true;
                    initializeNavigation();
                    flipbook.css('visibility', 'visible').hide().fadeIn(1000);
                    updatePageNumber();
                    document.dispatchEvent(new CustomEvent('pdfLoaded'));
                }, 100);
            });
        } catch (error) {
            console.error("Error loading pages:", error);
            overlay.innerHTML = `<div class="error-message">Error al cargar las páginas: ${error.message}</div>`;
        }
    }

    // Función para ajustar la visualización según el tamaño de la pantalla
    function adjustDisplay() {
        if (!isInitialized) return;

        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== currentIsMobile) {
            currentIsMobile = newIsMobile;
            const pageWidth = parseFloat($(".page").first().find("canvas").css("width"));
            const pageHeight = parseFloat($(".page").first().find("canvas").css("height"));

            // Actualizar opciones del flipbook
            flipbook.turn('size', currentIsMobile ? pageWidth : pageWidth * 2, pageHeight);
            flipbook.turn('display', currentIsMobile ? 'single' : 'double');
            
            // Ajustar el contenedor
            const container = document.getElementById('flipbook-container');
            if (currentIsMobile) {
                container.style.width = '100%';
            } else {
                container.style.width = (pageWidth * 2) + 'px';
                container.style.margin = '0 auto';
            }
        }
    }

    // Agregar listener para el cambio de tamaño de ventana
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(adjustDisplay, 100);
    });
});
