/* ═══════════════════════════════════════════════
   Nordic Beehive – Gedeelde navigatielogica
═══════════════════════════════════════════════ */

(function () {
    const current = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav-link").forEach(link => {
        const page = link.dataset.page;
        if (!page) return;
        const matches =
            (page === "home"         && (current === "" || current === "index.html")) ||
            (page === "bijenkasten"  && current === "bijenkasten.html") ||
            (page === "hoornaars"    && current === "hoornaars.html") ||
            (page === "configurator" && current === "configurator-v2.html") ||
            (page === "contact"      && current === "contact.html");
        if (matches) link.classList.add("active");
    });

    /* Smooth scroll voor ankerlinks — net boven sectietitel */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", function (e) {
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                e.preventDefault();
                const headerH = document.querySelector(".site-header")?.offsetHeight || 72;
                const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
                window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
            }
        });
    });
})();
