let prijzen = {};
let stack = [];
let bestelling = [];
let configuratieGewijzigd = false;

const IBAN = "BE00 0000 0000 0001";
const BEDRIJFSNAAM = "Nordic Beehive";
const VOORSCHOT_PERCENTAGE = 0.30;

function genereerReferentie() {
    const jaar = new Date().getFullYear().toString().slice(-2);
    const volgnummer = String(bestelling.length).padStart(3, "0");
    return `BH${jaar}-${volgnummer}`;
}

function berekenLeverdatum() {
    const d = new Date();
    d.setDate(d.getDate() + 42);
    return d.toLocaleDateString("nl-BE");
}

function formatPrijs(bedrag) {
    return new Intl.NumberFormat('nl-BE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(bedrag);
}

function structureerPrijzen(data) {

    const resultaat = {};

    data.forEach(rij => {

        const onderdeel = (rij.onderdeel || rij.Onderdeel || "").toLowerCase().trim();
        const optie = (rij.optie || rij.Optie || "").toLowerCase().trim();
        const variantRaw = (rij.variant || rij.Variant || "").toLowerCase().trim();
        const prijs = Number(rij.prijs || rij.Prijs || 0);

        if (!onderdeel) return;

        if (!resultaat[onderdeel]) {
            resultaat[onderdeel] = {
                basis: 0,
                opties: {}
            };
        }

        /* BASIS */

        if (optie === "basis") {
            resultaat[onderdeel].basis = prijs;
            return;
        }

        /* GEEN VARIANT */

        if (variantRaw === "-" || variantRaw === "") {
            resultaat[onderdeel].opties[optie] = prijs;
            return;
        }

        /* VARIANT */

        if (!resultaat[onderdeel].opties[optie]) {
            resultaat[onderdeel].opties[optie] = {};
        }

        resultaat[onderdeel].opties[optie][variantRaw] = prijs;
    });

    return resultaat;
}

function berekenPrijs() {

    let totaal = 0;

    function prijsWaarde(waarde) {
        return typeof waarde === "number" ? waarde : 0;
    }

    function waarde(id) {
        return document.getElementById(id)?.value?.toLowerCase() || "nee";
    }

    const dakSelect = document.getElementById("dakSelect")?.value;
    const bodemSelect = document.getElementById("bodemSelect")?.value;

    const modulePropolis = waarde("modulePropolis");
    const handvaten = waarde("handvaten");
    const hoekbescherming = waarde("hoekbescherming");
    const ramen = document.getElementById("ramen")?.value?.toLowerCase() || "nee";

    /* =======================
       BODEM
    ======================== */

    if (bodemSelect !== "none") {

        totaal += prijsWaarde(prijzen.bodem?.basis);

        if (waarde("bodemPropolis") === "ja") {
            totaal += prijsWaarde(prijzen.bodem?.opties?.propolis);
        }
    }

    /* =======================
       MIDDENMODULES
    ======================== */

    stack.forEach(item => {

        const p = prijzen[item.type];

        totaal += prijsWaarde(p?.basis);

        if (modulePropolis === "ja")
            totaal += prijsWaarde(p?.opties?.propolis);

        if (handvaten === "ja")
            totaal += prijsWaarde(p?.opties?.handvaten);

        if (hoekbescherming === "ja")
            totaal += prijsWaarde(p?.opties?.hoekbescherming);

        /* RAMEN VARIANTEN */

        if (ramen === "ja")
            totaal += prijsWaarde(p?.opties?.ramen?.ja);

        if (ramen === "was")
            totaal += prijsWaarde(p?.opties?.ramen?.waswafels);
    });

    /* =======================
       DAK
    ======================== */

    if (dakSelect === "Plat dak.svg") {

        totaal += prijsWaarde(prijzen.platdak?.basis);

        if (waarde("dakIsolatie") === "ja") {
            totaal += prijsWaarde(prijzen.platdak?.opties?.isolatie);
        }
    }

    if (dakSelect === "Chaletdak.svg") {

        totaal += prijsWaarde(prijzen.chaletdak?.basis);

        if (waarde("dakIsolatie") === "ja") {
            totaal += prijsWaarde(prijzen.chaletdak?.opties?.isolatie);
        }
    }

    return totaal;
}

document.querySelectorAll("select").forEach(select => {

    select.addEventListener("change", () => {
        updateVisual();
    });

});

function getDisplayName(svg) {

    if (svg.includes("Broedbak")) return "Broedbak";
    if (svg.includes("Honingzolder")) return "Honingzolder";
    if (svg.includes("Koninginnenrooster")) return "Koninginnenrooster";
    if (svg.includes("Plat")) return "Plat dak";
    if (svg.includes("Chalet")) return "Chalet dak";
    if (svg.includes("Bodem")) return "Bodem";

    return svg;
}

function addModule(svg) {

    let type = "";

    if (svg.indexOf("Broedbak") !== -1)
        type = "broedbak";

    else if (svg.indexOf("Honingzolder") !== -1)
        type = "honingzolder";

    else if (svg.indexOf("Koninginnenrooster") !== -1)
        type = "koninginnenrooster";   // 🔥 EXACT MATCH

    let defaultKleur = "geel";

    if (type === "koninginnenrooster")
        defaultKleur = "wit";

    stack.push({
        svg: svg,
        kleur: defaultKleur,
        type: type
    });

    updateUI();
    updateVisual();
}

function removeModule(index) {
    stack.splice(index, 1);
    updateUI();
    configuratieGewijzigd = true;
}

function updateKleur(index, kleur) {
    stack[index].kleur = kleur;
    updateVisual();
    configuratieGewijzigd = true;
}

function updateUI() {

    const list = document.getElementById("stackList");
    if (!list) return;

    list.innerHTML = "";

    stack.forEach((item, index) => {

        const li = document.createElement("li");

        let kleurSelector = "";

        const isColourable =
            item.svg.includes("Broedbak") ||
            item.svg.includes("Honingzolder") ||
            item.svg.includes("rooster") ||
            item.svg.includes("Rooster");

        if (isColourable) {

            kleurSelector = `
                <select onchange="updateKleur(${index}, this.value)">
                    <option value="wit" ${item.kleur === "wit" ? "selected" : ""}>Wit</option>
                    <option value="geel" ${item.kleur === "geel" ? "selected" : ""}>Geel</option>
                    <option value="rood" ${item.kleur === "rood" ? "selected" : ""}>Rood</option>
                    <option value="groen" ${item.kleur === "groen" ? "selected" : ""}>Groen</option>
                    <option value="blauw" ${item.kleur === "blauw" ? "selected" : ""}>Blauw</option>
                    <option value="roze" ${item.kleur === "roze" ? "selected" : ""}>Roze</option>
                </select>
            `;
        }

        li.innerHTML = `
            ${getDisplayName(item.svg)}
            ${kleurSelector}
            <button onclick="removeModule(${index})">❌</button>
        `;

        list.appendChild(li);
    });

    updateVisual();
    updateDakVisibility();
    updateBodemVisibility();
    updateModuleOpties();
    updateStackLabel();
}

function updateDakKleur(kleur) {
    document.getElementById("dakKleur").value = kleur;
    updateVisual();
}

function updateDakVisibility() {

    const dakSelectEl = document.getElementById("dakSelect");
    const wrapper = document.getElementById("dakKleurWrapper");

    if (!dakSelectEl || !wrapper) return;

    const zichtbaar = dakSelectEl.value !== "none";

    wrapper.style.display = zichtbaar ? "block" : "none";

    document.getElementById("dakIsolatie").style.display =
        zichtbaar ? "block" : "none";
}

function updateBodemVisibility() {

    const bodemSelectEl = document.getElementById("bodemSelect");
    const wrapper = document.getElementById("bodemKleurWrapper");

    if (!bodemSelectEl || !wrapper) return;

    const zichtbaar = bodemSelectEl.value !== "none";

    wrapper.style.display = zichtbaar ? "block" : "none";

    document.getElementById("bodemPropolis").style.display =
        zichtbaar ? "block" : "none";
}

function updateModuleOpties() {

    const wrapper = document.getElementById("moduleOpties");
    if (!wrapper) return;

    const heeftModules = stack.some(item =>
        item.svg.includes("Broedbak") ||
        item.svg.includes("Honingzolder")
    );

    wrapper.style.display = heeftModules ? "block" : "none";
}

function updateStackLabel() {

    const label = document.querySelector(".normal-label");
    if (!label) return;

    const heeftOnderdelen = stack.length > 0;

    label.style.display = heeftOnderdelen ? "block" : "none";
}

function loadSVG(svgFile, kleur, plankKleur = null) {

    const request = new XMLHttpRequest();
    request.open("GET", "svg/" + svgFile, false);
    request.send(null);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = request.responseText;

    const svgElement = wrapper.querySelector("svg");

    const kleuren = {
        geel: "#F4C678",
        rood: "#852C1E",
        wit: "#FFFFFF",
        blauw: "#4185AA",
        groen: "#7DA26F",
        roze: "#B78893"
    };

    const shapes = svgElement.querySelectorAll("*");

    shapes.forEach(node => {

        /* 🏆 1️⃣ DETAIL BESCHERMING (CRUCIAAL) */

        if (node.classList.contains("no-recolor")) return;

        const fill = node.getAttribute("fill");

        /* 🏆 2️⃣ PLANK KLEUR */

        if (plankKleur && node.classList.contains("plank-kleur")) {
            node.setAttribute("fill", kleuren[plankKleur]);
            return;
        }

        /* 🏆 3️⃣ ALGEMENE KLEURVLAKKEN */

        if (
            fill === "#F4C678" ||
            fill === "#FFFFFF" ||
            fill === "white"
        ) {
            node.setAttribute("fill", kleuren[kleur]);
        }
    });

    return wrapper;
}

function updateVisual() {
    
    const visualiser = document.getElementById("visualiser");
    if (!visualiser) return;

    visualiser.innerHTML = "";
    visualiser.style.position = "relative";

    const dakSelectEl = document.getElementById("dakSelect");
    const bodemSelectEl = document.getElementById("bodemSelect");

    const dakKleurEl = document.getElementById("dakKleur");
    const bodemKleurEl = document.getElementById("bodemKleur");
    const plankKleurEl = document.getElementById("plankKleur");

    const dak = dakSelectEl ? dakSelectEl.value : "none";
    const bodem = bodemSelectEl ? bodemSelectEl.value : "none";

    const dakKleur = dakKleurEl ? dakKleurEl.value : "geel";
    const bodemKleur = bodemKleurEl ? bodemKleurEl.value : "geel";
    const plankKleur = plankKleurEl ? plankKleurEl.value : "wit";

    let currentY = 0;

    function placeModule(node) {

        const svg = node.querySelector("svg");

        const height = svg.viewBox.baseVal.height;
        const width = svg.viewBox.baseVal.width;

        node.style.position = "absolute";

        /* 🏆 CENTRERING */
        node.style.left = `calc(50% - ${width / 2}px)`;

        node.style.bottom = `${currentY}px`;

        visualiser.appendChild(node);

        currentY += height -4;
    }

    /* 🏆 Bodem */

    if (bodem !== "none") {
        const bodemNode = loadSVG(bodem, bodemKleur, plankKleur);
        placeModule(bodemNode);
    }

    /* 🏆 Midden */

    stack.forEach(item => {
        const moduleNode = loadSVG(item.svg, item.kleur);
        placeModule(moduleNode);
    });

    /* 🏆 Dak */

    if (dak !== "none") {
        const dakNode = loadSVG(dak, dakKleur);
        dakNode.classList.add("dak");
        placeModule(dakNode);
    }

    /* 🏆 Visualiser hoogte correct zetten */

    visualiser.style.height = `${currentY}px`;

    const prijs = berekenPrijs();

    const prijsveld = document.getElementById("prijs");
    if (prijsveld) {
        prijsveld.innerText = formatPrijs(prijs);
    }
    
    const addBtn = document.getElementById("addToOrder");

    if (addBtn) {
        if (prijs > 0) {
            addBtn.classList.remove("hidden");
        } else {
            addBtn.classList.add("hidden");
        }
    }

}

fetch("prijzen.json")
    .then(res => res.json())
    .then(data => {
        prijzen = structureerPrijzen(data);
    });

document.addEventListener("DOMContentLoaded", function () {

    /* SELECTORS */

    const dakSelect = document.getElementById("dakSelect");
    const bodemSelect = document.getElementById("bodemSelect");

    const dakKleur = document.getElementById("dakKleur");
    const bodemKleur = document.getElementById("bodemKleur");
    const plankKleur = document.getElementById("plankKleur");

    const modulePropolis = document.getElementById("modulePropolis");
    const handvaten = document.getElementById("handvaten");
    const hoekbescherming = document.getElementById("hoekbescherming");
    const ramen = document.getElementById("ramen");

    const addBroedbak = document.getElementById("addBroedbak");
    const addHoningzolder = document.getElementById("addHoningzolder");
    const addRooster = document.getElementById("addRooster");

    /* DAK */

    if (dakSelect) {
        dakSelect.addEventListener("change", function () {
            configuratieGewijzigd = true;
            updateUI();
            updateDakVisibility();
            updateVisual();
        });
    }

    if (dakKleur) {
        dakKleur.addEventListener("change", updateVisual);

    }

    /* BODEM */

    if (bodemSelect) {
        bodemSelect.addEventListener("change", function () {
            updateUI();
            updateBodemVisibility();
            updateVisual();
            configuratieGewijzigd = true;
        });
    }

    if (bodemKleur) {
        bodemKleur.addEventListener("change", updateVisual);
    }

    if (plankKleur) {
        plankKleur.addEventListener("change", updateVisual);
    }

    /* MODULE OPTIES */

    if (modulePropolis) {
        modulePropolis.addEventListener("change", updateVisual);
    }

    if (handvaten) {
        handvaten.addEventListener("change", updateVisual);
    }

    if (hoekbescherming) {
        hoekbescherming.addEventListener("change", updateVisual);
    }

    if (ramen) {
        ramen.addEventListener("change", updateVisual);
    }

    /* TOEVOEGKNOPPEN */

    if (addBroedbak) {
        addBroedbak.addEventListener("click", function () {
            addModule("Broedbak basis.svg");
            configuratieGewijzigd = true;
        });
    }

    if (addHoningzolder) {
        addHoningzolder.addEventListener("click", function () {
            addModule("Honingzolder basis.svg");
            configuratieGewijzigd = true;
        });
    }

    if (addRooster) {
        addRooster.addEventListener("click", function () {
            addModule("Koninginnenrooster.svg");
            configuratieGewijzigd = true;
        });
    }

    /* INITIËLE UI SYNC (CRUCIAAL) */

    updateDakVisibility();
    updateBodemVisibility();
    updateModuleOpties();
    updateVisual();

    // 🔵 Elke wijziging binnen configurator markeert als gewijzigd
const configurator = document.getElementById("configurator");

if (configurator) {
    configurator.addEventListener("change", function () {
        configuratieGewijzigd = true;
    });

    configurator.addEventListener("click", function (e) {
        if (e.target.tagName === "BUTTON") {
            configuratieGewijzigd = true;
        }
    });
}
});

document.getElementById("addToOrder").addEventListener("click", async function () {

    const prijs = berekenPrijs();
    if (prijs <= 0) return;

    const snapshot = await maakSnapshot();
    const configuratie = buildConfiguratie();

    // Controleer aanwezige onderdelen
    const heeftBodem = configuratie.some(item => item.type === "bodem");
    const heeftDak = configuratie.some(item =>
        item.type === "platdak" || item.type === "chaletdak"
    );
    const heeftModules = configuratie.some(item =>
        item.type === "broedbak" || item.type === "honingzolder"
    );

    bestelling.push({
        
        snapshot: snapshot,
        configuratie: configuratie,
        beschrijving: genereerBeschrijving(configuratie),
        prijs: prijs,
        aantal: 1,
        opties: {
            propolisBodem:
                document.getElementById("bodemPropolis")?.value || "nee",

            dakisolatie:
                document.getElementById("dakIsolatie")?.value || "nee",

            propolisModule:
                document.getElementById("modulePropolis")?.value || "nee",

            hoekbescherming:
                document.getElementById("hoekbescherming")?.value || "nee",

            metalenHandvaten:
                document.getElementById("handvaten")?.value || "nee",

            ramen:
                document.getElementById("ramen")?.value || "nee"
        }
    });

    renderBestelling();
    resetConfigurator();
});

function genereerBeschrijving(configuratie) {
    const telling = {};

    configuratie.forEach(item => {

        const type = item.type;

        if (!telling[type]) telling[type] = 0;

        telling[type]++;
    });

    const volgorde = ["bodem", "broedbak", "honingzolder", "koninginnenrooster", "platdak", "chaletdak"];

    const labels = {
        bodem: "Bodem",
        broedbak: "Broedbak",
        honingzolder: "Honingzolder",
        koninginnenrooster: "Koninginnenrooster",
        platdak: "Plat dak",
        chaletdak: "Chalet dak"
    };

    return volgorde
        .filter(type => telling[type])
        .map(type => `${telling[type]} ${labels[type]}`)
        .join(" • ");
}

function renderBestelling() {

    const lijst = document.getElementById("bestellingLijst");
    const totaalBlok = document.getElementById("bestellingTotaal");
    const titel = document.getElementById("bestellingTitel");
    const blok = document.getElementById("bestellingBlok");

    if (!lijst || !totaalBlok || !blok) return;

    lijst.innerHTML = "";

    let totaal = 0;

    bestelling.forEach((kast, index) => {

        totaal += kast.prijs * kast.aantal;

        const div = document.createElement("div");
        div.className = "bestel-kaart";

        div.innerHTML = `
            <div class="bestel-visual">
                <img src="${kast.snapshot}">
            </div>

            <div class="bestel-info">
                <b>Kast ${index + 1}</b><br>
                <span class="bestel-beschrijving">
                    ${kast.beschrijving}
                </span>

                <div class="bestel-controls">
                    <button onclick="verlaagAantal(${index})">-</button>
                    ${kast.aantal}
                    <button onclick="verhoogAantal(${index})">+</button>
                </div>

                <div class="bestel-prijs">
                    € ${formatPrijs(kast.prijs * kast.aantal)}
                </div>

                <button onclick="verwijderKast(${index})">
                    Verwijderen
                </button>
            </div>
        `;

        lijst.appendChild(div);
    });

    if (bestelling.length > 0) {

        blok.classList.remove("hidden");

        if (titel) titel.classList.remove("hidden");

        totaalBlok.innerHTML =
            `Totaalprijs (incl. btw): € ${formatPrijs(totaal)}`;

    } else {

        blok.classList.add("hidden");

        if (titel) titel.classList.add("hidden");

        totaalBlok.innerHTML = "";
    }
}

function resetConfigurator() {

    // Stack leegmaken
    stack = [];

    // Dak reset
    const dakSelect = document.getElementById("dakSelect");
    if (dakSelect) dakSelect.value = "none";

    // Bodem reset
    const bodemSelect = document.getElementById("bodemSelect");
    if (bodemSelect) bodemSelect.value = "none";

    // ⚠️ Opties blijven behouden (modulePropolis, handvaten, enz.)

    updateUI();
    updateVisual();
}

function buildConfiguratie() {

    const configuratie = [];

    const bodemSelect = document.getElementById("bodemSelect");
    const bodemKleur = document.getElementById("bodemKleur")?.value;
    const vliegplankKleur = document.getElementById("plankKleur")?.value;

    if (bodemSelect && bodemSelect.value !== "none") {
        configuratie.push({
            type: "bodem",
            kleur: bodemKleur || "",
            vliegplankKleur: vliegplankKleur || ""
        });
    }

    stack.forEach(item => configuratie.push(item));

    const dakSelect = document.getElementById("dakSelect");
    const dakKleur = document.getElementById("dakKleur")?.value;

    if (dakSelect && dakSelect.value !== "none") {

        const dakType =
            dakSelect.value.includes("Plat") ? "platdak" : "chaletdak";

        configuratie.push({
            type: dakType,
            kleur: dakKleur || ""
        });
    }

    return configuratie;
}

async function maakSnapshot() {

    const visualiser = document.getElementById("visualiser");

    const origineleTransform = visualiser.style.transform;
    visualiser.style.transform = "none";

    await new Promise(r => setTimeout(r, 50));

    const width = visualiser.scrollWidth;
    const height = visualiser.scrollHeight;

    const canvas = await html2canvas(visualiser, {
        backgroundColor: null,
        scale: 2,
        width: width,
        height: height
    });

    visualiser.style.transform = origineleTransform;

    return canvas.toDataURL("image/png");
}

function verhoogAantal(index) {
    bestelling[index].aantal++;
    renderBestelling();
}

function verlaagAantal(index) {

    if (bestelling[index].aantal > 1)
        bestelling[index].aantal--;

    renderBestelling();
}

function verwijderKast(index) {
    bestelling.splice(index, 1);
    renderBestelling();
}

const bevestigBtn = document.getElementById("bevestigBestelling");
const vraagBtn = document.getElementById("stelVraag");
const formulierBlok = document.getElementById("formulierBlok");
const formulierTitel = document.getElementById("formulierTitel");

if (bevestigBtn) {
    bevestigBtn.addEventListener("click", () => {
        formulierBlok.classList.remove("hidden");
        formulierTitel.innerText = "Bevestig uw bestelling";
        document.getElementById("formulierType").value = "bestelling";

        updateFormulierWeergave();   // 👈 TOEVOEGEN

        formulierBlok.scrollIntoView({ behavior: "smooth" });
    });
}

if (vraagBtn) {
    vraagBtn.addEventListener("click", () => {
        formulierBlok.classList.remove("hidden");
        formulierTitel.innerText = "Stel uw vraag";
        document.getElementById("formulierType").value = "info";

        updateFormulierWeergave();   // 👈 TOEVOEGEN

        formulierBlok.scrollIntoView({ behavior: "smooth" });
    });
}

function genereerBestelOverzicht() {

    let tekst = "";

    bestelling.forEach((kast, i) => {

        tekst += "====================================\n";
        tekst += `KAST ${i + 1}\n`;
        tekst += "------------------------------------\n";
        tekst += `Aantal: ${kast.aantal}\n`;
        tekst += `Prijs: € ${formatPrijs(kast.prijs * kast.aantal)}\n\n`;

        tekst += "STRUCTUUR:\n";

        kast.configuratie.forEach(item => {

            let kleur = item.kleur ? ` (kleur: ${item.kleur})` : "";

            if (item.type === "bodem") {

                let bodemKleur = item.kleur ? `kleur: ${item.kleur}` : "";
                let vliegplank = item.vliegplankKleur
                    ? `, vliegplank: ${item.vliegplankKleur}`
                    : "";

                tekst += `- Bodem (${bodemKleur}${vliegplank})\n`;
            }

            if (item.type === "broedbak")
                tekst += `- Broedbak${kleur}\n`;

            if (item.type === "honingzolder")
                tekst += `- Honingzolder${kleur}\n`;

            if (item.type === "platdak")
                tekst += `- Plat dak${kleur}\n`;

            if (item.type === "chaletdak")
                tekst += `- Chalet dak${kleur}\n`;
        });

        tekst += "\nOPTIES:\n";

        let heeftOpties = false;

        // 🔵 PROPOLIS BODEM
        if (kast.opties?.propolisBodem === "ja") {
            tekst += "- Propolis bodem\n";
            heeftOpties = true;
        }

        // 🔵 PROPOLIS MODULE
        if (kast.opties?.propolisModule === "ja") {
            tekst += "- Propolis broedbak / honingzolder\n";
            heeftOpties = true;
        }

        // 🔵 HOEKBESCHERMING
        if (kast.opties?.hoekbescherming === "ja") {
            tekst += "- Hoekbescherming\n";
            heeftOpties = true;
        }

        // 🔵 METALEN HANDVATEN
        if (kast.opties?.metalenHandvaten === "ja") {
            tekst += "- Metalen handvaten\n";
            heeftOpties = true;
        }

        // 🔵 RAMEN
        if (kast.opties?.ramen === "ja") {
            tekst += "- Gemonteerde ramen\n";
            heeftOpties = true;
        }

        if (kast.opties?.ramen === "was") {
            tekst += "- Gemonteerde ramen inclusief waswafels\n";
            heeftOpties = true;
        }

        // 🔵 DAKISOLATIE
        if (kast.opties?.dakisolatie === "ja") {
            tekst += "- Dakisolatie\n";
            heeftOpties = true;
        }

        if (!heeftOpties) {
            tekst += "- Geen extra opties\n";
        }

        tekst += "\n\n";
    });

    return tekst;
}

function isGeldigEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
}

function berekenTotaalBestelling() {
    return bestelling.reduce((totaal, item) => {
        return totaal + (item.prijs * item.aantal);
    }, 0);
}

document.getElementById("factuur").addEventListener("change", function () {
    document.getElementById("btwBlok")
        .classList.toggle("hidden", !this.checked);
});

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        if (!isGeldigEmail(email)) {
            alert("Gelieve een geldig e-mailadres in te vullen.");
            return;
        }

        const formulierType = document.getElementById("formulierType").value;
        const endpoint = "https://formspree.io/f/xlgwvrpq";

        // 🔹 Basisgegevens
        const naam = document.getElementById("naam").value;
        const telefoon = document.getElementById("telefoon")?.value || "";
        const opmerking = document.getElementById("opmerking")?.value || "";

        let data;

        // =====================================================
        // 🔵 FLOW 1 – INFO AANVRAAG
        // =====================================================
        if (formulierType === "info") {

            data = {
                subject: "Nieuwe informatieaanvraag van Nordic Beehive",
                type: "Info aanvraag",
                naam,
                email,
                telefoon,
                opmerking
            };

        }

        // =====================================================
        // 🔵 FLOW 2 – BESTELLING
        // =====================================================
        if (formulierType === "bestelling") {

            const referentie = genereerReferentie();
            const totaal = berekenTotaalBestelling();
            const voorschot = (totaal * VOORSCHOT_PERCENTAGE).toFixed(2);
            const leverdatum = berekenLeverdatum();

            data = {
                subject: "Nieuwe bestellingsaanvraag van Nordic Beehive",
                type: "Bestelling",
                referentie,
                naam,
                email,
                telefoon,
                overzicht: genereerBestelOverzicht(),
                totaal: "€ " + totaal.toFixed(2),
                leverdatum,
                opmerking,
            };

            // 🔵 Tweede mail naar klant (orderbevestiging)
            await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    subject: `Orderbevestiging ${referentie} – Nordic Beehive`,
                    message: `
====================================
NORDIC BEEHIVE
====================================

Beste ${naam},

Hartelijk dank voor uw bestelling.

Referentie: ${referentie}

------------------------------------
OVERZICHT BESTELLING
------------------------------------
${genereerBestelOverzicht()}

Totaalprijs (incl. btw): € ${totaal.toFixed(2)}
Transport niet inbegrepen. Levering in overleg.

Voorschot (30%): € ${voorschot}

IBAN: ${IBAN}
Ten name van: ${BEDRIJFSNAAM}
Mededeling: ${referentie}

Vermoedelijke leverdatum: ${leverdatum}

Het restbedrag wordt voldaan bij afhaling.
Indien levering wordt afgesproken, dient het saldo vóór levering betaald te worden.

Voor vragen mag u op deze mail reageren.

Met vriendelijke groet,
Nordic Beehive
`
                })
            });
        }

        // 🔹 Mail naar jou
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert("Uw aanvraag werd succesvol verzonden.");
            contactForm.reset();
            formulierBlok.classList.add("hidden");
        } else {
            alert("Er is een fout opgetreden. Probeer opnieuw.");
        }

    });
}

function updateFormulierVelden() {

    const type = document.getElementById("formulierType").value;

    const adresVelden = ["straat", "postcode", "gemeente"];

    adresVelden.forEach(id => {
        const veld = document.getElementById(id);
        if (!veld) return;

        veld.required = (type === "bestelling");
        veld.closest(".form-group")
            .classList.toggle("hidden", type !== "bestelling");
    });

    document.getElementById("factuur")
        .closest(".form-group")
        .classList.toggle("hidden", type !== "bestelling");
}

function updateFormulierWeergave() {

    const type = document.getElementById("formulierType").value;

    const bestellingVelden = [
        "straat",
        "postcode",
        "gemeente",
        "factuur"
    ];

    bestellingVelden.forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;

        const group = element.closest(".form-group");
        if (!group) return;

        group.style.display = (type === "bestelling") ? "block" : "none";
    });

    const opmerkingLabel = document.getElementById("opmerkingLabel");

    if (type === "info") {
        opmerkingLabel.textContent = "Vraag";
    } else {
        opmerkingLabel.textContent = "Opmerking";
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const formulierType = document.getElementById("formulierType");

    if (formulierType) {
        formulierType.addEventListener("change", updateFormulierWeergave);

        // Belangrijk: ook meteen uitvoeren bij laden
        updateFormulierWeergave();
    }

});

// Zet dit op true bij elke wijziging
function markeerWijziging() {
    configuratieGewijzigd = true;
}

window.addEventListener("beforeunload", function (e) {

    // Enkel waarschuwing als er effectief iets in configuratie zit
    if (berekenPrijs() <= 0) return;

    e.preventDefault();
    e.returnValue = "";
});

