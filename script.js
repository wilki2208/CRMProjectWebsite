const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  },
  {
    threshold: 0.18,
  },
);

for (const element of revealElements) {
  revealObserver.observe(element);
}

const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !company || !message) {
      formStatus.textContent = "Please complete all fields before sending.";
      formStatus.classList.remove("is-success");
      return;
    }

    formStatus.textContent =
      "Placeholder only: this enquiry form is ready for real inbox wiring on the next iteration.";
    formStatus.classList.add("is-success");
    contactForm.reset();
  });
}
