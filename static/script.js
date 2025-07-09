/* TEXT ANIMATION (CUANDO SE REFRESCA LA PÁGINA) */
document.documentElement.style.setProperty('--animate-duration', '2s');
/* END TEXT ANIMATION (CUANDO SE REFRESCA LA PÁGINA) */


// REEMPLAZANDO EL scroll-behavior: smooth;
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });
        }
    });
});
// FIN REEMPLAZANDO EL scroll-behavior: smooth; 

/* PREOLOADER LINE ANIMATION */
const preloader = document.querySelector("[data-preloader]");

window.addEventListener("DOMContentLoaded", function () {
    preloader.classList.add("loaded");
    document.body.classList.add("loaded");
});
/* END PREOLOADER LINE ANIMATION */

// BUTTON MENU RESPONSIVE 
// Get necessary elements
const header = document.querySelector('header.nav');
const homeSection = document.querySelector('.showcase');
const menuBtn = document.querySelector(".menu-btn");
const navigation = document.querySelector(".navigation");
const navigationItems = document.querySelector(".navigation-items");

// Fondo negro cuando salga un 30% del home section y que al refresar se mantenga negro
function verificarScroll() {
    const triggerPoint = homeSection.offsetTop + homeSection.offsetHeight * 0.3;
    if (window.scrollY > triggerPoint - header.offsetHeight) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}
window.addEventListener('load', verificarScroll);
window.addEventListener('scroll', verificarScroll);

// Toggle menu
menuBtn.addEventListener("click", () => {
    menuBtn.classList.toggle("active");
    navigation.classList.toggle("active");
});

// Close on overlay click
navigation.addEventListener("click", (e) => {
    if (e.target === navigation) {
        menuBtn.classList.remove("active");
        navigation.classList.remove("active");
    }
});

// Close on link click
document.querySelectorAll(".navigation-items a").forEach(link => {
    link.addEventListener("click", () => {
        menuBtn.classList.remove("active");
        navigation.classList.remove("active");
    });
});

// END BUTTON MENU RESPONSIVE

// Si le borro no se muestra el navbar
document.body.classList.remove("loading");

/*=============== SHOW MODAL ===============*/
const showModal = (openButton, modalContent) => {
    const openBtn = document.getElementById(openButton),
        modalContainer = document.getElementById(modalContent)

    if (openBtn && modalContainer) {
        openBtn.addEventListener('click', () => {
            modalContainer.classList.add('show-modal')
        })
    }
}
showModal('open-modal', 'modal-container')

/*=============== CLOSE MODAL ===============*/
const closeBtn = document.querySelectorAll('.close-modal')

function closeModal() {
    const modalContainer = document.getElementById('modal-container')
    modalContainer.classList.remove('show-modal')
}
closeBtn.forEach(c => c.addEventListener('click', closeModal))

// cerrar el modal al hacer click fuera de el
const modalContainer = document.getElementById('modal-container');
const modalContent = document.querySelector('.modal__content');

modalContainer.addEventListener('click', function (e) {
    if (!modalContent.contains(e.target)) {
        closeModal();
    }
});
/*=============== END CLOSE MODAL ===============*/

// MAPA SECTION
// const mapa = L.map('map').setView([-6.5, -70], 5);
const mapa = L.map('map');
mapa.fitBounds([[-13.0, -78.0], [-3.0, -68.0]]);


const areaEstudio =
    // DEL DATASET DEPURADO
    L.rectangle([[-13.0, -78.0], [-3.0, -68.0]],
        // DEL DATASET DE FIRMS
        // L.rectangle([[-14.9973, -81.2334], [1.5992, -61.207]],
        {
            color: "#000",
            weight: 2,
            fillOpacity: 0.1,
            dashArray: "5,5"
        }).addTo(mapa).bindPopup(`
    <b>Área de estudio con el Dataset</b><br>
    Latitud: -13.0° a -3.0°<br>
    Longitud: -78.0° a -68.0°
`);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);

let marcadores = [];
let coordenadasProcesadas = new Set();
let regionesSeleccionadas = new Set();

const regiones = {
    'Loreto': [{ lat: -4.0, lon: -74.5 }, { lat: -3.5, lon: -73.0 }, { lat: -5.0, lon: -75.0 }],
    'Ucayali': [{ lat: -9.5, lon: -74.8 }, { lat: -10.0, lon: -73.8 }, { lat: -8.7, lon: -74.0 }],
    'Madre de Dios': [{ lat: -12.5, lon: -69.8 }, { lat: -11.8, lon: -70.5 }, { lat: -12.0, lon: -69.0 }],
    'San Martín': [{ lat: -7.2, lon: -76.8 }, { lat: -6.8, lon: -76.2 }, { lat: -7.0, lon: -75.8 }],
    'Huánuco': [{ lat: -9.8, lon: -75.5 }, { lat: -10.3, lon: -75.0 }, { lat: -10.0, lon: -74.6 }],
    'Amazonas': [{ lat: -5.8, lon: -77.5 }, { lat: -6.2, lon: -76.8 }, { lat: -5.5, lon: -76.5 }],
    'Puno': [{ lat: -13.0, lon: -70.5 }, { lat: -12.5, lon: -71.0 }, { lat: -12.8, lon: -70.0 }]
};

function generarID(lat, lon) {
    return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

let fechaSeleccionada = null;

function generarDias() {
    const selectDia = document.getElementById('select-dia');
    const hoy = new Date();

    for (let i = 0; i <= 15; i++) {
        const futura = new Date(hoy);
        futura.setDate(hoy.getDate() + i);

        const iso = formatoFechaLocal(futura);  // <<< CORREGIDO
        const label = `${futura.getDate()}/${futura.getMonth() + 1}`;
        const option = new Option(label, iso);
        selectDia.appendChild(option);
    }

    // choices.js para seleccionar fecha 
    new Choices(selectDia, {
        searchEnabled: false,
        itemSelectText: '',
        shouldSort: false,
        renderSelectedChoices: false,
        removeItemButton: false
    });

    fechaSeleccionada = selectDia.value;

    selectDia.addEventListener('change', () => {
        fechaSeleccionada = selectDia.value;

        const partes = fechaSeleccionada.split('-');
        const fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;

        Swal.fire({
            title: '📅 Fecha cambiada',
            icon: 'info',
            html: `Has seleccionado el <b>${fechaFormateada}</b>.<br>Los datos mostrados en el mapa serán correspondientes a esta fecha.`,
            confirmButtonText: 'Entendido'
        }).then(() => {
            limpiarMapa();
            document.getElementById('region').value = "";
        });
    });
}


function formatoFechaLocal(fecha) {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}


document.addEventListener("DOMContentLoaded", () => {
    generarDias();

    // choices.js para select-region
    const regionSelect = document.getElementById("region");
    new Choices(regionSelect, {
        searchEnabled: false,
        itemSelectText: '',
        shouldSort: false,
        renderSelectedChoices: false,
        removeItemButton: false,
        placeholder: true,                // ACTIVAMOS placeholder
        placeholderValue: 'Elegir Región' // TEXTO QUE SE MUESTRA
    });

});
function seleccionarDepartamento(nombre) {
    if (regionesSeleccionadas.has(nombre)) {
        Swal.fire({ icon: 'info', title: 'Región ya seleccionada', text: `Ya cargaste los puntos de ${nombre}.` });
        return;
    }
    if (regiones[nombre]) {
        regionesSeleccionadas.add(nombre);
        procesarPrediccion(regiones[nombre]);
    }
}

function verTodos() {
    let todos = [];
    Object.values(regiones).forEach(r => todos = todos.concat(r));
    procesarPrediccion(todos);
}

function procesarPrediccion(puntos) {
    const nuevosPuntos = puntos.filter(p => !coordenadasProcesadas.has(generarID(p.lat, p.lon)));

    if (nuevosPuntos.length === 0) {
        Swal.fire("✅ Todos los puntos ya fueron cargados.");
        return;
    }

    Swal.fire({
        title: 'Cargando...',
        html: `Consultando el modelo para los nuevos puntos.<br><br><strong>📍 Se generarán ${nuevosPuntos.length} puntos</strong>`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    // fetch('http://127.0.0.1:5001/predecir', {
    fetch('https://prediccion-de-incendios.onrender.com/predecir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntos: nuevosPuntos, fecha: fechaSeleccionada })
    })
        .then(res => res.json())
        .then(data => {
            Swal.close();
            mostrarPredicciones(data);
        })
        .catch(err => {
            Swal.fire("❌ Error al procesar puntos", err.message, "error");
        });
}
function limpiarMapa() {
    marcadores.forEach(m => mapa.removeLayer(m));
    marcadores = [];
    coordenadasProcesadas.clear();
    regionesSeleccionadas.clear();
}

const drawControl = new L.Control.Draw({
    draw: { polygon: true, rectangle: true, polyline: false, circle: false, marker: false, circlemarker: false },
    edit: false
});
mapa.addControl(drawControl);

mapa.on(L.Draw.Event.CREATED, function (e) {
    const layer = e.layer;
    const bounds = layer.getBounds();
    const puntos = [];
    for (let lat = bounds.getSouth(); lat <= bounds.getNorth(); lat += 0.5) {
        for (let lon = bounds.getWest(); lon <= bounds.getEast(); lon += 0.5) {
            puntos.push({ lat, lon });
        }
    }

    if (puntos.length > 50) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Demasiados puntos',
            text: `Máximo permitido: 50 puntos. Tu selección generó ${puntos.length} puntos.`,
            confirmButtonText: 'Entendido'
        });
        return;
    }

    const fueraDeArea = puntos.some(p => p.lat < -13 || p.lat > -3 || p.lon < -78 || p.lon > -68);

    const continuarDibujo = () => {
        Swal.fire({
            title: 'Cargando...',
            html: `Consultando el modelo para los nuevos puntos.<br><br><strong>📍 Se generarán ${puntos.length} puntos</strong>`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        procesarPrediccion(puntos);
    };

    if (fueraDeArea) {
        Swal.fire({
            icon: 'question',
            title: '📍 Selección fuera del área de estudio',
            html: 'La predicción podría no ser precisa, ya que no existen datos históricos disponibles para esta zona.<br><br>¿Deseas continuar?',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        }).then(result => { if (result.isConfirmed) continuarDibujo(); });
    } else {
        continuarDibujo();
    }
});
function formatearFecha(fechaString) {
    const partes = fechaString.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// 🔍 NUEVA FUNCIÓN: Buscar por coordenadas manuales
function buscarCoordenadas() {
    const lat = parseFloat(document.getElementById('input-lat').value);
    const lon = parseFloat(document.getElementById('input-lon').value);

    if (isNaN(lat) || isNaN(lon)) {
        Swal.fire({
            icon: 'warning',
            title: 'Coordenadas inválidas',
            text: 'Por favor, ingresa una latitud y longitud válidas.'
        });
        return;
    }

    const dentroDeArea = (lat >= -13.0 && lat <= -3.0) && (lon >= -78.0 && lon <= -68);

    const continuarBusqueda = () => {
        Swal.fire({
            title: 'Consultando ubicación...',
            html: `Latitud: ${lat} <br> Longitud: ${lon}`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        fetch('https://prediccion-de-incendios.onrender.com/predecir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ puntos: [{ lat: lat, lon: lon }], fecha: fechaSeleccionada })
        })
            .then(res => res.json())
            .then(data => {
                Swal.close();

                if (data.length === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Sin datos disponibles',
                        text: 'No se pudo obtener información para estas coordenadas.'
                    });
                    return;
                }

                mostrarPredicciones(data);
                mapa.setView([data[0].lat, data[0].lon], 10);
            })
            .catch(err => {
                Swal.fire("❌ Error al procesar la búsqueda", err.message, "error");
            });
    };

    if (!dentroDeArea) {
        Swal.fire({
            icon: 'question',
            title: '📍 Coordenadas fuera del área de estudio',
            html: 'La predicción podría no ser precisa, ya que no existen datos históricos disponibles para esta zona.<br><br>¿Deseas continuar de todas formas?',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                continuarBusqueda();
            }
        });
    } else {
        continuarBusqueda();
    }
}
function mostrarPredicciones(data) {
    data.forEach(p => {
        let color = p.prob >= 75 ? 'red' : p.prob >= 50 ? 'yellow' : 'green';

        const marker = L.circleMarker([p.lat, p.lon], {
            radius: 8,
            color,
            fillColor: color,
            fillOpacity: 0.7
        }).addTo(mapa);

        const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        const nombreDia = diasSemana[p.dia_semana];
        const nombreMes = meses[p.mes - 1];

        const info = `
            <b>Coordenadas:</b> ${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}<br>
            <b>Incendio:</b> ${p.prob >= 75 ? 'Probabilidad Alta' : p.prob >= 50 ? 'Probabilidad Media' : 'Probabilidad Baja'}<br>    
            <b>Probabilidad estimada:</b> ${p.prob}%<br>
            <b>Temperatura:</b> ${p.info.temperature} °C<br>
            <b>Humedad:</b> ${p.info.humidity} %<br>
            <b>Precipitación:</b> ${p.info.precipitation} mm<br>
            <b>Viento:</b> ${p.info.windspeed.toFixed(2)} m/s<br>
            <b>Fecha de los datos:</b> ${formatearFecha(p.info.fecha)}<br>
            <b>Mes:</b> ${nombreMes}<br>
            <b>Día de semana:</b> ${nombreDia}<br>
            <b>¿Fin de semana?:</b> ${p.es_fin_semana ? 'Sí' : 'No'}<br>
            <b>¿Es verano?:</b> ${p.es_verano ? 'Sí' : 'No'}<br>
        `;
        marker.bindPopup(info);
        marcadores.push(marker);
        coordenadasProcesadas.add(generarID(p.lat, p.lon));
    });
}
// END MAPA SECTION  

// CONTACT SECTION
const inputs = document.querySelectorAll(".input");
function focusFunc() {
    let parent = this.parentNode;
    parent.classList.add("focus");
}
function blurFunc() {
    let parent = this.parentNode;
    if (this.value == "") {
        parent.classList.remove("focus");
    }
}
inputs.forEach((input) => {
    input.addEventListener("focus", focusFunc);
    input.addEventListener("blur", blurFunc);
});


// EMAILJS
document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("uCOAM7YJaLZ5NI45y"); // Tu Public Key

    const form = document.querySelector(".contact-form form");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            message: form.message.value.trim()
        };

        // Validaciones
        if (!formData.name || formData.name.length < 3) {
            Swal.fire({ icon: 'warning', title: 'Nombre inválido', text: 'Ingresa un nombre real (mín. 3 letras).' });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            Swal.fire({ icon: 'error', title: 'Email inválido', text: 'Ingresa un correo válido.' });
            return;
        }

        if (!/^\+\d{7,15}$/.test(formData.phone)) {
            Swal.fire({ icon: 'error', title: 'Celular inválido', text: 'Incluye el código de país. Ej: +51953808566' });
            return;
        }

        if (formData.message.length < 3) {
            Swal.fire({ icon: 'warning', title: 'Mensaje muy corto', text: 'El mensaje debe tener al menos 3 caracteres.' });
            return;
        }

        // Enviar con EmailJS
        emailjs.send("service_b4shxgr", "template_8k4rluf", formData)
            .then(() => {
                Swal.fire({ icon: 'success', title: '¡Mensaje enviado!', text: 'Gracias por contactarnos.' });
                form.reset();
            })
            .catch((error) => {
                Swal.fire({ icon: 'error', title: 'Error al enviar', text: 'Revisa tu conexión o intenta más tarde.' });
                console.error("EmailJS error:", error);
            });
    });
});

// END EMAIL JS
// END CONTACT SECTION





