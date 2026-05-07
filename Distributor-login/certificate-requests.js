const list = document.querySelector("#certificateRequestList");

function loadCertificateRequests() {
  try {
    const saved = JSON.parse(localStorage.getItem("certificateRequests") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCertificateRequests(requests) {
  localStorage.setItem("certificateRequests", JSON.stringify(requests));
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function renderCertificateRequests() {
  const requests = loadCertificateRequests();
  if (!requests.length) {
    list.innerHTML = '<div class="empty-state">Abhi koi certificate request nahi hai.</div>';
    return;
  }
  list.innerHTML = requests
    .map(
      (request, index) => `
        <article class="payment-request ${String(request.status).toLowerCase()}">
          <div>
            <strong>${escapeHtml(request.branchName)}</strong>
            <span>${escapeHtml(request.studentName)} | Roll: ${escapeHtml(request.studentRoll)}</span>
            <small>${escapeHtml(request.course)} | ${escapeHtml(request.created)} | Status: ${escapeHtml(request.status)}</small>
          </div>
          <div class="request-actions">
            <button class="tiny-btn" data-approve="${index}" type="button">Verify / Approve</button>
            <button class="tiny-btn danger" data-cancel="${index}" type="button">Cancel</button>
            <button class="tiny-btn danger" data-delete="${index}" type="button">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");

  list.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => {
      const requests = loadCertificateRequests();
      requests[Number(button.dataset.approve)].status = "Approved";
      requests[Number(button.dataset.approve)].synced = false;
      saveCertificateRequests(requests);
      renderCertificateRequests();
    });
  });

  list.querySelectorAll("[data-cancel]").forEach((button) => {
    button.addEventListener("click", () => {
      const requests = loadCertificateRequests();
      requests[Number(button.dataset.cancel)].status = "Cancelled";
      requests[Number(button.dataset.cancel)].synced = true;
      saveCertificateRequests(requests);
      renderCertificateRequests();
    });
  });

  list.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const requests = loadCertificateRequests();
      requests.splice(Number(button.dataset.delete), 1);
      saveCertificateRequests(requests);
      renderCertificateRequests();
    });
  });
}

renderCertificateRequests();
