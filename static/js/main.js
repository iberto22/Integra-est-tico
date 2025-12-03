document.addEventListener("DOMContentLoaded", () => {
  const servicesUrl = "/static/data/services.json";

  // Detect current page
  const path = window.location.pathname;
  const isHome = path === "/" || path.endsWith("index.html");
  const isServices = path.endsWith("servicios.html");
  const isServiceDetail = path.endsWith("servicio.html");

  if (isHome || isServices || isServiceDetail) {
    fetch(servicesUrl)
      .then((response) => response.json())
      .then((data) => {
        if (isHome) {
          renderHomeServices(data);
        } else if (isServices) {
          renderAllServices(data);
        } else if (isServiceDetail) {
          renderServiceDetail(data);
        }
      })
      .catch((error) => console.error("Error loading services:", error));
  }
});

function renderHomeServices(services) {
  const container = document.getElementById("services-container");
  if (!container) return;

  container.innerHTML = "";
  // Show first 4 services
  services.slice(0, 4).forEach((s) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${s.image}" alt="${s.title}">
      <h3>${s.title}</h3>
      <p>${s.shortDescription}</p>
      <a class="btn small primary" href="/servicio.html?id=${s.id}">Leer más</a>
    `;
    container.appendChild(card);
  });
}

function renderAllServices(services) {
  const container = document.getElementById("services-grid");
  if (!container) return;

  container.innerHTML = "";
  services.forEach((s) => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `
      <img src="${s.image}" alt="${s.title}">
      <h3>${s.title}</h3>
      <p>${s.shortDescription}</p>
      <a class="btn-service" href="/servicio.html?id=${s.id}">Leer más</a>
    `;
    container.appendChild(card);
  });
}

function renderServiceDetail(services) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const service = services.find((s) => s.id === id);

  if (!service) {
    document.querySelector(".service-page").innerHTML =
      '<h2>Servicio no encontrado</h2><a href="/servicios.html" class="btn-primary">Volver a servicios</a>';
    return;
  }

  // Update page title
  document.title = `${service.title} - Integra Health & Sport`;

  // Populate fields
  document.getElementById("service-title").textContent = service.title;
  document.getElementById("service-desc").textContent = service.fullDescription;
  document.getElementById("service-img").src = service.image;
  document.getElementById("service-img").alt = service.title;

  const benefitsList = document.getElementById("service-benefits");
  benefitsList.innerHTML = "";
  if (service.benefits && service.benefits.length > 0) {
    service.benefits.forEach((b) => {
      const li = document.createElement("li");
      li.textContent = b;
      benefitsList.appendChild(li);
    });
  } else {
    benefitsList.innerHTML = "<li>No hay beneficios listados.</li>";
  }

  // Render "More services"
  const moreContainer = document.getElementById("more-services-grid");
  if (moreContainer) {
    moreContainer.innerHTML = "";
    const otherServices = services.filter((s) => s.id !== id);

    if (otherServices.length > 0) {
      otherServices.forEach((s) => {
        const a = document.createElement("a");
        a.href = `/servicio.html?id=${s.id}`;
        a.className = "more-card";
        a.innerHTML = `
          <img src="${s.image}" alt="${s.title}">
          <h4>${s.title}</h4>
        `;
        moreContainer.appendChild(a);
      });
    } else {
      moreContainer.innerHTML = "<p>No hay otros servicios disponibles.</p>";
    }
  }
}

// =============================
// FORMULARI DE CONTACTE
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formStatus = document.getElementById("form-status");
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;

      // Mostrar estat de càrrega
      submitButton.textContent = "Enviant...";
      submitButton.disabled = true;
      formStatus.style.display = "none";

      try {
        const formData = new FormData(contactForm);
        const response = await fetch(contactForm.action, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          // Èxit
          formStatus.innerHTML = `
            <div style="padding: 15px; background-color: #d4edda; color: #155724; border-radius: 8px; border: 1px solid #c3e6cb;">
              ✅ <strong>Missatge enviat correctament!</strong><br>
              Ens posarem en contacte amb tu aviat.
            </div>
          `;
          formStatus.style.display = "block";
          contactForm.reset();
        } else {
          // Error del servidor
          const data = await response.json();
          formStatus.innerHTML = `
            <div style="padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 8px; border: 1px solid #f5c6cb;">
              ❌ <strong>Error en enviar el missatge.</strong><br>
              Si us plau, intenta-ho de nou o contacta'ns directament.
            </div>
          `;
          formStatus.style.display = "block";
        }
      } catch (error) {
        // Error de xarxa
        formStatus.innerHTML = `
          <div style="padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 8px; border: 1px solid #f5c6cb;">
            ❌ <strong>Error de connexió.</strong><br>
            Comprova la teva connexió a Internet i torna-ho a intentar.
          </div>
        `;
        formStatus.style.display = "block";
      } finally {
        // Restaurar botó
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }
});
