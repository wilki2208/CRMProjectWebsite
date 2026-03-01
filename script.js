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
const orderForm = document.getElementById("order-form");
const orderOutput = document.getElementById("order-output");
const orderStatus = document.getElementById("order-status");
const orderDownloadButton = document.getElementById("order-download");
let latestOrderText = "";

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

function toPositiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function toCurrencyGBP(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

if (orderForm && orderOutput && orderStatus && orderDownloadButton) {
  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(orderForm);
    const customerCompany = String(formData.get("customer_company") || "").trim();
    const customerEntity = String(formData.get("customer_entity") || "").trim();
    const contactName = String(formData.get("contact_name") || "").trim();
    const contactEmail = String(formData.get("contact_email") || "").trim();
    const deploymentOption = String(formData.get("deployment_option") || "").trim();
    const goLiveDate = String(formData.get("go_live") || "").trim();
    const scopeSummary = String(formData.get("scope_summary") || "").trim();
    const assumptions = String(formData.get("assumptions") || "").trim();
    const setupFee = toPositiveNumber(formData.get("setup_fee"));
    const monthlyFee = toPositiveNumber(formData.get("monthly_fee"));
    const selectedAddons = formData
      .getAll("addons")
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (
      !customerCompany ||
      !customerEntity ||
      !contactName ||
      !contactEmail ||
      !deploymentOption ||
      !scopeSummary
    ) {
      orderStatus.textContent = "Please complete all required order fields.";
      return;
    }

    const now = new Date();
    const orderReference = `FH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}${String(now.getDate()).padStart(2, "0")}-${Math.floor(
      Math.random() * 9000 + 1000,
    )}`;
    const generatedDate = now.toLocaleDateString("en-GB");
    const annualSupportEstimate = monthlyFee > 0 ? monthlyFee * 12 : 0;
    const firstYearEstimate = setupFee + annualSupportEstimate;
    const addonText = selectedAddons.length > 0 ? selectedAddons.join(", ") : "None selected";
    const goLiveText = goLiveDate || "TBC";
    const assumptionsText = assumptions || "None recorded.";

    latestOrderText = [
      "FREEHOLD CRM - ORDER SUMMARY",
      "========================================",
      `Order reference: ${orderReference}`,
      `Generated date: ${generatedDate}`,
      "",
      "CUSTOMER",
      "----------------------------------------",
      `Customer company: ${customerCompany}`,
      `Legal entity: ${customerEntity}`,
      `Primary contact: ${contactName}`,
      `Contact email: ${contactEmail}`,
      "",
      "COMMERCIALS",
      "----------------------------------------",
      `Implementation fee (one-off): ${toCurrencyGBP(setupFee)}`,
      `Managed service monthly: ${toCurrencyGBP(monthlyFee)}`,
      `First-year estimated total: ${toCurrencyGBP(firstYearEstimate)}`,
      `Deployment option: ${deploymentOption}`,
      `Target go-live: ${goLiveText}`,
      `Add-ons: ${addonText}`,
      "",
      "SCOPE",
      "----------------------------------------",
      scopeSummary,
      "",
      "ASSUMPTIONS / EXCLUSIONS",
      "----------------------------------------",
      assumptionsText,
      "",
      "LICENCE AND IP TERMS (SUMMARY)",
      "----------------------------------------",
      "1. Freehold CRM retains all intellectual property rights and copyright",
      "   in the Freehold CRM platform and source code.",
      "2. Customer is granted a perpetual, non-exclusive licence to use and",
      "   modify the software for internal business operations.",
      "3. Customer may not resell, redistribute, sublicense, white-label,",
      "   or otherwise provide the software to third parties.",
      "4. Detailed legal terms are governed by the signed MSA and order form.",
      "",
      "NOTES",
      "----------------------------------------",
      "This generated summary is a commercial draft and should be issued",
      "with your formal contract documents.",
    ].join("\n");

    orderOutput.textContent = latestOrderText;
    orderDownloadButton.disabled = false;
    orderStatus.textContent =
      "Order form generated. Download the text copy and send with contract terms.";
  });

  orderDownloadButton.addEventListener("click", () => {
    if (!latestOrderText) {
      orderStatus.textContent = "Generate an order form first.";
      return;
    }

    const customerCompany =
      String(new FormData(orderForm).get("customer_company") || "customer").trim() || "customer";
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `freehold-order-${slugify(customerCompany)}-${datePart}.txt`;
    const blob = new Blob([latestOrderText], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  });
}
