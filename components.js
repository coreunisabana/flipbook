document.addEventListener('DOMContentLoaded', function() {
    // Cargar navbar
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('afterbegin', data);
        });

    // Cargar footer
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('beforeend', data);
        });
}); 