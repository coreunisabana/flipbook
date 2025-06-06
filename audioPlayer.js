class AudioPlayer {
    constructor(audioPath) {
        console.log('Creando nuevo AudioPlayer con:', audioPath);
        this.audio = new Audio(audioPath);
        this.isPlaying = false;
        this.isMuted = false;
        this.isReady = false;
        this.isIOS = this.detectIOS();
        
        // Configurar atributos adicionales para iOS
        if (this.isIOS) {
            console.log('Dispositivo iOS detectado, configurando para compatibilidad');
            this.audio.preload = 'metadata';
            this.audio.setAttribute('playsinline', '');
            this.audio.setAttribute('webkit-playsinline', '');
        }
        
        this.initializePlayer();

        // Manejar errores de carga del audio
        this.audio.addEventListener('error', (e) => {
            console.error('Error en la carga del audio:', e);
            console.error('Código de error:', e.target.error ? e.target.error.code : 'desconocido');
        });

        // Marcar como listo cuando el audio esté cargado
        this.audio.addEventListener('canplaythrough', () => {
            console.log('Audio listo para reproducir');
            this.isReady = true;
            this.updateDuration();
            this.updateProgress();
        });
    }

    // Detectar si estamos en iOS
    detectIOS() {
        const ua = navigator.userAgent;
        return /iPad|iPhone|iPod/.test(ua) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    initializePlayer() {
        console.log('Inicializando controles del reproductor');
        
        // Elementos del DOM
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.rewindBtn = document.getElementById('rewindBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.progressBar = document.querySelector('.progress-bar');
        this.progressFilled = document.querySelector('.progress-filled');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');

        // Asegurarse de que todos los elementos existen
        if (!this.playPauseBtn || !this.progressBar) {
            console.error('No se encontraron los elementos necesarios para el reproductor de audio');
            return;
        }

        // Event listeners para el audio
        this.audio.addEventListener('loadedmetadata', () => {
            console.log('Audio metadata cargada');
            this.updateDuration();
            this.updateProgress();
        });
        
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            this.updateProgress();
        });

        // Event listeners para los controles con manejo mejorado para iOS
        this.playPauseBtn.addEventListener('click', () => {
            // En iOS, necesitamos cargar el audio antes de reproducirlo
            if (this.isIOS && !this.isReady) {
                console.log('Precargando audio para iOS...');
                this.audio.load();
                this.audio.addEventListener('canplaythrough', () => {
                    this.togglePlay();
                }, { once: true });
            } else {
                this.togglePlay();
            }
        });
        
        this.rewindBtn.addEventListener('click', () => this.skip(-5));
        this.forwardBtn.addEventListener('click', () => this.skip(5));
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        
        // Event listener para la barra de progreso
        this.progressBar.addEventListener('click', (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.togglePlay();
            } else if (e.code === 'ArrowLeft' && e.altKey) {
                e.preventDefault();
                this.skip(-5);
            } else if (e.code === 'ArrowRight' && e.altKey) {
                e.preventDefault();
                this.skip(5);
            } else if (e.code === 'KeyM') {
                e.preventDefault();
                this.toggleMute();
            }
        });
    }

    async togglePlay() {
        try {
            if (!this.isReady && !this.isIOS) {
                console.log('El audio aún no está listo para reproducir');
                return;
            }

            if (this.isPlaying) {
                await this.audio.pause();
                this.playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                this.isPlaying = false;
            } else {
                try {
                    const playPromise = this.audio.play();
                    
                    // En Safari/iOS, play() puede no devolver una promesa
                    if (playPromise !== undefined) {
                        await playPromise;
                    }
                    
                    this.playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    this.isPlaying = true;
                } catch (playError) {
                    console.error('Error al reproducir audio:', playError);
                    
                    // Si es un error de interacción en iOS/Safari
                    if (this.isIOS) {
                        console.log('Error de reproducción en iOS - se requiere interacción del usuario');
                        alert('Para escuchar el audio, por favor toque el botón de reproducción.');
                    }
                    
                    this.playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    this.isPlaying = false;
                }
            }
            
            console.log('Estado de reproducción:', this.isPlaying ? 'reproduciendo' : 'pausado');
        } catch (error) {
            console.error('Error general al reproducir/pausar:', error);
        }
    }

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        this.isMuted = this.audio.muted;
        this.muteBtn.innerHTML = this.isMuted ? 
            '<i class="fa-solid fa-volume-xmark"></i>' : 
            '<i class="fa-solid fa-volume-high"></i>';
    }

    skip(seconds) {
        this.audio.currentTime = Math.max(0, Math.min(this.audio.currentTime + seconds, this.audio.duration));
    }

    updateProgress() {
        if (!this.audio.duration || isNaN(this.audio.duration)) return;
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressFilled.style.width = `${percent}%`;
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }

    updateDuration() {
        if (!this.audio.duration || isNaN(this.audio.duration)) {
            this.durationEl.textContent = '0:00';
        } else {
            this.durationEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
} 