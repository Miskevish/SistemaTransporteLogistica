
document.addEventListener("DOMContentLoaded", function () {

    const paginaInicio = document.getElementById("paginaInicio");
    const paginaIngresar = document.getElementById("paginaIngresar");

    const enlacesNavbar = document.querySelectorAll(
        ".navbar-tramo [data-pagina]"
    );

    const anioCopyright = document.getElementById("anioCopyright");

    if (anioCopyright) {
        anioCopyright.textContent = new Date().getFullYear();
    }

    function mostrarPaginaPublica() {

        const paginaSeleccionada =
            window.location.hash === "#ingresar"
                ? "ingresar"
                : "inicio";

        paginaInicio.classList.add("d-none");
        paginaIngresar.classList.add("d-none");

        if (paginaSeleccionada === "ingresar") {
            paginaIngresar.classList.remove("d-none");
        } else {
            paginaInicio.classList.remove("d-none");
        }

        enlacesNavbar.forEach(function (enlace) {

            const activo =
                enlace.dataset.pagina === paginaSeleccionada;

            enlace.classList.toggle("activo", activo);

            if (activo) {
                enlace.setAttribute("aria-current", "page");
            } else {
                enlace.removeAttribute("aria-current");
            }
        });

        const menu = document.getElementById("navbarTramo");

        if (menu && menu.classList.contains("show")) {

            const instancia = bootstrap.Collapse.getInstance(menu);

            if (instancia) {
                instancia.hide();
            }
        }

        if (paginaSeleccionada === "ingresar") {
            window.scrollTo(0, 0);
        }
    }

    mostrarPaginaPublica();

    window.addEventListener(
        "hashchange",
        mostrarPaginaPublica
    );

    document.querySelectorAll(
        '[data-pagina="ingresar"]'
    ).forEach(function (enlace) {

        enlace.addEventListener("click", function () {

            if (window.location.hash === "#ingresar") {
                mostrarPaginaPublica();
            }
        });
    });

});
