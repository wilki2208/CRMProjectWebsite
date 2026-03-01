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
const orderPdfButton = document.getElementById("order-download-pdf");
let latestOrderText = "";
let latestOrderData = null;

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lineBreakHtml(value) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function buildOrderPdfHtml(data) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Freehold CRM Order ${escapeHtml(data.orderReference)}</title>
    <style>
      :root {
        --ink: #1f1d1a;
        --muted: #5f584d;
        --line: rgba(70, 51, 21, 0.25);
        --accent: #b84c2e;
        --good: #1f7a45;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: "Manrope", "Segoe UI", sans-serif;
        color: var(--ink);
        background: #fff;
      }
      .page {
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
        padding: 28px 30px 34px;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 2px solid var(--line);
        padding-bottom: 14px;
        margin-bottom: 18px;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }
      .brand img {
        width: 34px;
        height: 34px;
      }
      .brand strong {
        font-size: 20px;
        font-family: "Space Grotesk", "Arial Narrow", sans-serif;
      }
      .brand span {
        display: block;
        font-size: 12px;
        color: var(--muted);
      }
      .meta {
        text-align: right;
        font-size: 12px;
        color: var(--muted);
        line-height: 1.45;
      }
      h1 {
        margin: 0 0 8px;
        font-family: "Space Grotesk", "Arial Narrow", sans-serif;
        font-size: 24px;
        letter-spacing: -0.02em;
      }
      h2 {
        margin: 0 0 8px;
        font-family: "Space Grotesk", "Arial Narrow", sans-serif;
        font-size: 16px;
      }
      .section {
        margin-top: 14px;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px;
      }
      .section p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
      }
      .k {
        font-weight: 700;
      }
      .list {
        margin: 6px 0 0;
        padding-left: 18px;
      }
      .list li {
        margin: 0 0 4px;
        font-size: 13px;
        line-height: 1.45;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 16px;
      }
      .signature {
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .sig-box {
        border-top: 1px solid var(--line);
        padding-top: 8px;
        min-height: 64px;
      }
      .sig-box p {
        margin: 0;
        font-size: 12px;
        color: var(--muted);
      }
      .footer-note {
        margin-top: 12px;
        font-size: 11px;
        color: var(--muted);
      }
      .tag {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(31, 122, 69, 0.12);
        color: var(--good);
      }
      @media print {
        .page { max-width: none; padding: 16mm 14mm; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header">
        <div class="brand">
          <img src="${escapeHtml(data.logoUrl)}" alt="Freehold CRM logo" />
          <div>
            <strong>Freehold CRM</strong>
            <span>Order Summary and Commercial Terms</span>
          </div>
        </div>
        <div class="meta">
          <div><span class="k">Reference:</span> ${escapeHtml(data.orderReference)}</div>
          <div><span class="k">Generated:</span> ${escapeHtml(data.generatedDate)}</div>
          <div><span class="k">Target go-live:</span> ${escapeHtml(data.goLiveText)}</div>
        </div>
      </header>

      <h1>Order for ${escapeHtml(data.customerCompany)}</h1>
      <span class="tag">Commercial draft pending contract execution</span>

      <section class="section">
        <h2>Customer details</h2>
        <div class="grid">
          <p><span class="k">Legal entity:</span> ${escapeHtml(data.customerEntity)}</p>
          <p><span class="k">Primary contact:</span> ${escapeHtml(data.contactName)}</p>
          <p><span class="k">Contact email:</span> ${escapeHtml(data.contactEmail)}</p>
          <p><span class="k">Deployment model:</span> ${escapeHtml(data.deploymentOption)}</p>
        </div>
      </section>

      <section class="section">
        <h2>Commercials</h2>
        <div class="grid">
          <p><span class="k">Implementation fee:</span> ${escapeHtml(data.setupFeeText)}</p>
          <p><span class="k">Monthly managed service:</span> ${escapeHtml(data.monthlyFeeText)}</p>
          <p><span class="k">First-year estimate:</span> ${escapeHtml(data.firstYearEstimateText)}</p>
          <p><span class="k">Add-ons:</span> ${escapeHtml(data.addonText)}</p>
        </div>
      </section>

      <section class="section">
        <h2>Scope</h2>
        <p>${lineBreakHtml(data.scopeSummary)}</p>
      </section>

      <section class="section">
        <h2>Assumptions and exclusions</h2>
        <p>${lineBreakHtml(data.assumptionsText)}</p>
      </section>

      <section class="section">
        <h2>IP and licence summary</h2>
        <ul class="list">
          <li>Freehold CRM retains all intellectual property rights and source code ownership.</li>
          <li>Customer receives a perpetual, non-exclusive licence for internal business use and internal modification.</li>
          <li>Resale, redistribution, sublicensing, and white-label use are prohibited.</li>
          <li>Binding legal terms are defined in the signed MSA and order form.</li>
        </ul>
      </section>

      <section class="section">
        <h2>Acceptance confirmations</h2>
        <ul class="list">
          <li>Authority to place order: Confirmed</li>
          <li>IP ownership and source code terms accepted: Confirmed</li>
          <li>No resale / redistribution terms accepted: Confirmed</li>
        </ul>
      </section>

      <div class="signature">
        <div class="sig-box">
          <p><span class="k">Customer signatory:</span> ${escapeHtml(data.signName)}</p>
          <p><span class="k">Title:</span> ${escapeHtml(data.signTitle)}</p>
          <p><span class="k">Date:</span> ${escapeHtml(data.signDate)}</p>
        </div>
        <div class="sig-box">
          <p><span class="k">Freehold CRM representative:</span> ${escapeHtml(data.freeholdRep)}</p>
          <p><span class="k">Date:</span> ${escapeHtml(data.generatedDate)}</p>
        </div>
      </div>

      <p class="footer-note">
        This document is a generated commercial summary for proposal speed and consistency.
        It should be issued with formal contract documents before signature.
      </p>
    </main>
  </body>
</html>`;
}

function triggerPrintPdf(orderData) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=980,height=1280");
  if (!printWindow) {
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(buildOrderPdfHtml(orderData));
  printWindow.document.close();
  printWindow.focus();
  const runPrint = () => printWindow.print();
  if (printWindow.document.readyState === "complete") {
    runPrint();
  } else {
    printWindow.addEventListener("load", runPrint, { once: true });
  }
  return true;
}

if (orderForm && orderOutput && orderStatus && orderDownloadButton && orderPdfButton) {
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
    const signName = String(formData.get("sign_name") || "").trim();
    const signTitle = String(formData.get("sign_title") || "").trim();
    const signDate = String(formData.get("sign_date") || "").trim();
    const freeholdRep = String(formData.get("freehold_rep") || "").trim() || "TBC";
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
      !scopeSummary ||
      !signName ||
      !signTitle ||
      !signDate
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
    const setupFeeText = toCurrencyGBP(setupFee);
    const monthlyFeeText = toCurrencyGBP(monthlyFee);
    const firstYearEstimateText = toCurrencyGBP(firstYearEstimate);
    const logoUrl = new URL("assets/freehold-crm-logo.svg", window.location.href).href;

    latestOrderData = {
      orderReference,
      generatedDate,
      customerCompany,
      customerEntity,
      contactName,
      contactEmail,
      deploymentOption,
      goLiveText,
      setupFeeText,
      monthlyFeeText,
      firstYearEstimateText,
      addonText,
      scopeSummary,
      assumptionsText,
      signName,
      signTitle,
      signDate,
      freeholdRep,
      logoUrl,
    };

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
      `Implementation fee (one-off): ${setupFeeText}`,
      `Managed service monthly: ${monthlyFeeText}`,
      `First-year estimated total: ${firstYearEstimateText}`,
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
      "ACCEPTANCE CONFIRMATIONS",
      "----------------------------------------",
      "1. Authority to place order on behalf of the customer: Confirmed",
      "2. IP ownership and source code terms accepted: Confirmed",
      "3. No resale / redistribution terms accepted: Confirmed",
      "",
      "SIGNATURES",
      "----------------------------------------",
      `Customer signatory: ${signName}`,
      `Title: ${signTitle}`,
      `Signature date: ${signDate}`,
      `Freehold CRM representative: ${freeholdRep}`,
      "",
      "NOTES",
      "----------------------------------------",
      "This generated summary is a commercial draft and should be issued",
      "with your formal contract documents.",
    ].join("\n");

    orderOutput.textContent = latestOrderText;
    orderDownloadButton.disabled = false;
    orderPdfButton.disabled = false;
    orderStatus.textContent =
      "Order form generated. Download PDF or text copy and send with contract terms.";
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

  orderPdfButton.addEventListener("click", () => {
    if (!latestOrderData) {
      orderStatus.textContent = "Generate an order form first.";
      return;
    }
    const printed = triggerPrintPdf(latestOrderData);
    orderStatus.textContent = printed
      ? "Print dialog opened. Choose 'Save as PDF' to export the branded order form."
      : "Pop-up blocked. Allow pop-ups for this site to export PDF.";
  });
}
