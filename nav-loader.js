document.addEventListener('DOMContentLoaded', function() {
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            // Insertar el navbar al principio del body
            document.body.insertAdjacentHTML('afterbegin', data);
            
            // Comprobar si el evento del hamburger ya está inicializado
            const hamburger = document.querySelector('.hamburger');
            if (hamburger && !hamburger._initialized) {
                // Inicializar los event listeners después de insertar el navbar
                initializeNavbar();
            }
        })
        .catch(error => console.error('Error cargando el navbar:', error));
});

function initializeNavbar() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (!hamburger || !navLinks) return;

    // Marcar como inicializado para evitar duplicar event listeners
    hamburger._initialized = true;

    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
        console.log('Hamburger clicked from nav-loader.js');
    });

    // Cerrar el menú al hacer click en un enlace
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Cerrar el menú al hacer click fuera de él
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar') && !e.target.closest('.hamburger')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
} 