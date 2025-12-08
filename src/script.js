const width = 700;
const height = 580;

const svg = d3
    .select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const g = svg.append("g");

const projection = d3
    .geoConicConformal()
    .center([2.454071, 46.279229])
    .scale(2800)
    .translate([width / 2, height / 2]);

const color = d3
    .scaleQuantize()
    .range(["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"]);

const path = d3.geoPath().projection(projection);

let geojson;
let dataByDept;
let allDEEE;

const tooltip = d3
    .select("#tooltip")

const years = ["2009", "2011", "2013", "2015", "2017", "2019", "2021"];

d3.select("#day").html(years[0]);

// Chargement des données
d3.csv("./data/Tonnage_Decheterie.csv").then(function (data) {
    console.log("CSV rows:", data.length);
    console.log("First row:", data[0]);

    allDEEE = data.filter(row =>
        row.L_TYP_REG_DECHET === "DEEE"
    );

    console.log("Total DEEE rows:", allDEEE.length);
    console.log("Sample DEEE:", allDEEE.slice(0, 3));

    dataByDept = d3.group(allDEEE, d => d.C_DEPT);

    d3.json("./data/departements-version-simplifiee.geojson").then(function (json) {

        console.log("GeoJSON features length:", json.features.length);

        for (let f of json.features) {
            const depCode = f.properties.code;
            const lignesDep = dataByDept.get(depCode) || [];

            f.properties.series = lignesDep.map(row => ({
                annee: row.ANNEE,
                valeur: parseFloat(row.TONNAGE_T.replace(",", "."))
            }));
        }
        geojson = json;
        drawMap(years[0]);
    });
});

// Légende des couleurs
const legendWidth = 260;
const legendHeight = 12;

const legendContainer = d3.select("#map-container")
    .append("div")
    .attr("id", "legend-container");

const legendSvg = legendContainer
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", 40);

legendContainer.append("div")
    .style("margin-top", "6px")
    .html("Tonnage de déchets DEEE (en tonnes)");

const legendScale = d3.scaleLinear().range([0, legendWidth]);
const legendAxis = legendSvg.append("g").attr("transform", "translate(0,20)");

function updateLegend(minVal, maxVal) {
    legendSvg.selectAll("*").remove();

    const gradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legendGradient");

    const colors = color.range();
    colors.forEach((c, i) => {
        gradient.append("stop")
            .attr("offset", `${(i / (colors.length - 1)) * 100}%`)
            .attr("stop-color", c);
    });

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("fill", "url(#legendGradient)");

    legendScale.domain([minVal, maxVal]);
    legendAxis.call(
        d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => d.toFixed(0))
    );
}

function drawMap(year) {
    const values = [];

    for (let f of geojson.features) {
        const ligne = f.properties.series.find(s => s.annee === year);
        f.properties.value = ligne ? ligne.valeur : 0;
        if (ligne) values.push(ligne.valeur);
    }

    const minVal = d3.min(values);
    const maxVal = d3.max(values);

    color.domain([minVal, maxVal]);
    updateLegend(minVal, maxVal);

    // Animation + mise à jour
    g.selectAll("path")
        .data(geojson.features)
        .join("path")
        .transition()
        .duration(600)
        .attr("d", path)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .attr("fill", d => d.properties.value ? color(d.properties.value) : "#ccc");

    // Tooltip
    g.selectAll("path")
        .on("mousemove", function (event, d) {
            tooltip
                .classed("hidden", false)
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 60) + "px")
                .html(`
                    <strong>${d.properties.nom}</strong><br>
                    ${d.properties.value.toFixed(2)} tonnes
                `);
        })
        .on("mouseout", () => tooltip.classed("hidden", true));
}

// Listener du slider
d3.select("#slider").on("input", function () {
    const year = String(2009 + 2 * this.value);
    d3.select("#day").html(year);
    drawMap(year);
});