const width = 700;
const height = 580;

const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// On rajoute un groupe englobant toute la visualisation pour plus tard
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

let anneeChoisie = "2011";

const tooltip = d3
    .select("#tooltip")

// Chargement des donnees
d3.csv("./data/Tonnage_Decheterie.csv").then(function (data) {
    console.log("CSV rows:", data.length);
    console.log("First row:", data[0]);

    const allDEEE = data.filter(row =>
        row.L_TYP_REG_DECHET === "DEEE"
    );

    console.log("Total DEEE rows:", allDEEE.length);
    console.log("Sample DEEE:", allDEEE.slice(0, 3));

    const dataByDept = d3.group(allDEEE, d => d.C_DEPT);
    const cleanDataYear = allDEEE.filter(row => row.ANNEE === anneeChoisie);
    console.log("Filetered rows FOR YEAR", cleanDataYear.length);
    console.log("Sample for year", cleanDataYear.slice(0, 3));

    const minVal = d3.min(cleanDataYear, d => parseFloat(d.TONNAGE_T.replace(",", ".")));
    const maxVal = d3.max(cleanDataYear, d => parseFloat(d.TONNAGE_T.replace(",", ".")));

    console.log("Min tonnage:", minVal);
    console.log("Max tonnage:", maxVal);

    color.domain([minVal, maxVal]);

    d3.json("./data/departements-version-simplifiee.geojson").then(function (json) {

        console.log("GeoJSON features:", json.features.length);
        console.log("First feature:", json.features[0].properties);

        for (let f of json.features) {
            const depCode = f.properties.code;

            const lignesDep = dataByDept.get(depCode) || [];

            f.properties.series = lignesDep.map(row => ({
                annee: row.ANNEE,
                valeur: parseFloat(row.TONNAGE_T.replace(",", "."))
            }));

            const ligneChoisie = f.properties.series.find(d => d.annee === anneeChoisie);
            f.properties.value = ligneChoisie ? ligneChoisie.valeur : 0;
        }

        console.log("Example series: ", json.features[0].properties.series);
        console.log("Example merged value:", json.features[0].properties.value);

        g.selectAll("path")
            .data(json.features)
            .join("path")
            .attr("d", path)
            .attr("stroke", "white")
            .attr("stroke-width", 0.5)
            .attr("fill", d => {
                const v = d.properties.value;
                return v ? color(v) : "#ccc";
            })
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

        console.log("Rendered paths:", document.querySelectorAll("path").length);
    });
});
