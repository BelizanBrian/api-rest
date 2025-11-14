        // Configuración de la API y Referencias del DOM
        const API_BASE_URL = 'https://rickandmortyapi.com/api/character';
        const resultsDiv = document.getElementById('results');
        const filterForm = document.getElementById('filterForm');
        const getAllBtn = document.getElementById('getAllBtn');
        const clearBtn = document.getElementById('clearBtn');
        const initialMessage = document.getElementById('initialMessage');
        const filterInputs = {
            name: document.getElementById('name'),
            status: document.getElementById('status'),
            species: document.getElementById('species'),
            type: document.getElementById('type'),
            gender: document.getElementById('gender'),
        };

        /**
         * Muestra un mensaje de carga y oculta el mensaje inicial.
         */
        function startLoading() {
            resultsDiv.innerHTML = `<div class="loading-message">Cargando datos...</div>`;
            initialMessage.style.display = 'none';
        }

        /**
         * Muestra un mensaje de error en la pantalla.
         * @param {string} message - El mensaje de error a mostrar.
         */
        function renderError(message) {
            resultsDiv.innerHTML = `
                <div class="error-message">
                    <p class="title">Error en la Solicitud</p>
                    <p>${message}</p>
                    <p style="margin-top: 8px; font-size: 0.8em; color: rgba(255, 255, 255, 0.7);">Intenta ajustar los filtros o verifica la conexión.</p>
                </div>
            `;
        }

        /**
         * Renderiza los resultados (tarjetas de personajes) en la pantalla.
         * @param {Object} data - Objeto de respuesta de la API que contiene 'results'.
         */
        function renderResults(data) {
            resultsDiv.innerHTML = '';
            
            if (!data.results || data.results.length === 0) {
                 resultsDiv.innerHTML = `
                    <div class="no-results">
                        <p class="title">Sin Resultados</p>
                        <p>No se encontraron personajes que coincidan con los criterios de búsqueda.</p>
                    </div>
                `;
                return;
            }

            // Muestra un contador de resultados
            const infoText = document.createElement('p');
            infoText.style.textAlign = "center";
            infoText.style.fontSize = "1.2em";
            infoText.style.color = "var(--rm-green)";
            infoText.style.marginBottom = "20px";
            infoText.textContent = `Mostrando ${data.results.length} resultados.`;
            resultsDiv.appendChild(infoText);


            const grid = document.createElement('div');
            grid.className = 'character-grid';

            data.results.forEach(character => {
                const statusClass = `status-${character.status.replace(/\s/g, '')}`;

                const card = document.createElement('div');
                card.className = 'character-card';
                card.innerHTML = `
                    <img src="${character.image}" alt="${character.name}" 
                         onerror="this.onerror=null; this.src='https://placehold.co/400x300/4d4e73/97ce4c?text=Imagen+No+Disp.';">
                    <div class="card-content">
                        <h3>${character.name}</h3>
                        <div class="status-badge">
                            <span class="status-indicator ${statusClass}"></span>
                            <span style="color: rgba(255, 255, 255, 0.8);">${character.status} - ${character.species}</span>
                        </div>
                        <p><strong>Género:</strong> ${character.gender}</p>
                        <p><strong>Origen:</strong> ${character.origin.name}</p>
                        <p><strong>Última Ubicación:</strong> ${character.location.name}</p>
                    </div>
                `;
                grid.appendChild(card);
            });

            resultsDiv.appendChild(grid);
        }

        /**
         * Lógica principal para obtener personajes de la API con manejo de errores y reintentos.
         * @param {string} url - La URL completa de la API a consultar.
         */
        async function fetchCharacters(url) {
            startLoading();
            
            const maxRetries = 3;
            let retries = 0;

            while (retries < maxRetries) {
                try {
                    const response = await fetch(url);
                    
                    if (response.ok) {
                        const data = await response.json();
                        renderResults(data);
                        return; // Éxito
                    } else if (response.status === 404) {
                        // Código específico de la API cuando no hay resultados para los filtros
                        renderResults({ results: [] }); 
                        return;
                    } else {
                        // Otros errores HTTP (ej: 500)
                        throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
                    }

                } catch (error) {
                    console.error('Fetch error:', error);
                    retries++;
                    if (retries < maxRetries) {
                        // Espera exponencial (1s, 2s, 4s)
                        const delay = Math.pow(2, retries) * 1000; 
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        // Fallo después del último reintento
                        renderError(`No se pudo completar la solicitud. Detalles: ${error.message}.`);
                    }
                }
            }
        }

        // MANEJADORES DE EVENTOS
        
        // 1. Obtener TODOS los personajes (primera página)
        getAllBtn.addEventListener('click', () => {
            fetchCharacters(API_BASE_URL);
        });
        
        // 2. Limpiar la pantalla
        clearBtn.addEventListener('click', () => {
            resultsDiv.innerHTML = '';
            initialMessage.style.display = 'block';
            
            // Opcional: limpiar inputs de filtro
            for (const key in filterInputs) {
                filterInputs[key].value = key === 'status' || key === 'gender' ? '' : '';
            }
        });

        // 3. Formulario de filtros
        filterForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita el envío por defecto

            const params = [];
            // Construye los parámetros de la URL solo con valores no vacíos
            for (const key in filterInputs) {
                const value = filterInputs[key].value.trim();
                if (value) {
                    // Codifica el valor para URL (ej: espacios)
                    params.push(`${key}=${encodeURIComponent(value)}`);
                }
            }

            if (params.length === 0) {
                renderError("Por favor, ingresa al menos un valor en un campo de filtro antes de buscar.");
                return;
            }

            const queryString = params.join('&');
            const url = `${API_BASE_URL}?${queryString}`;

            fetchCharacters(url);
        });