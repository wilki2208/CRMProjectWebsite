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
const contactSubmitButton = contactForm?.querySelector('button[type="submit"]');

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
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

    const payload = {
      full_name: name,
      email,
      source: "Freehold CRM Website",
      preferred_contact_method: "email",
      notes: `Company: ${company}\n\nWebsite enquiry:\n${message}`,
    };

    if (contactSubmitButton) contactSubmitButton.disabled = true;
    formStatus.textContent = "Sending your enquiry...";
    formStatus.classList.remove("is-success");

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let detail = "We could not submit your enquiry. Please try again.";
        try {
          const errorBody = await response.json();
          if (errorBody?.detail && typeof errorBody.detail === "string") {
            detail = errorBody.detail;
          }
        } catch {
          // Keep default error message when response is not JSON.
        }
        throw new Error(detail);
      }

      formStatus.textContent =
        "Thanks, your enquiry has been received and added as a lead in Freehold CRM.";
      formStatus.classList.add("is-success");
      contactForm.reset();
    } catch (error) {
      formStatus.textContent =
        error instanceof Error
          ? error.message
          : "We could not submit your enquiry. Please try again.";
      formStatus.classList.remove("is-success");
    } finally {
      if (contactSubmitButton) contactSubmitButton.disabled = false;
    }
  });
}
