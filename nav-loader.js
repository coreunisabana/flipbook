document.addEventListener('DOMContentLoaded', function() {
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            // Insertar el navbar al principio del body
            document.body.insertAdjacentHTML('afterbegin', data);
            
            // Inicializar los event listeners después de insertar el navbar
            initializeNavbar();
        })
        .catch(error => console.error('Error cargando el navbar:', error));
});

function initializeNavbar() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
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
        if (!e.target.closest('.navbar')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
} 