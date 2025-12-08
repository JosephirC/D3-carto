const width = 700;
const height = 580;

const svg = d3
    .select("body")
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

function drawMap(year) {
    console.log("drawMap for year: ", year);
    const values = [];

    for (let f of geojson.features) {

        const ligne = f.properties.series.find(s =>
            s.annee === year
        );

        f.properties.value = ligne ? ligne.valeur : 0;

        if (ligne) values.push(ligne.valeur);
    }

    color.domain([d3.min(values), d3.max(values)]);

    g.selectAll("path")
        .data(geojson.features)
        .join("path")
        .attr("d", path)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .attr("fill", d => d.properties.value ? color(d.properties.value) : "#ccc")
        .on("mouseover", function (event, d) {
            const [x, y] = d3.pointer(event);
            tooltip
                .classed("hidden", false)
                .style("left", (x + 15) + "px")
                .style("top", (y - 20) + "px")
                .html(
                    `<strong>${d.properties.nom}</strong><br>
                     ${d.properties.value.toFixed(2)} tonnes`
                );
        })
        .on("mouseout", function () {
            tooltip.classed("hidden", true);
        });
}

// Listener du slider
d3.select("#slider").on("input", function () {
    const year = String(2009 + 2 * this.value);
    d3.select("#day").html(year);
    drawMap(year);
});
