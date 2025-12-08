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

    const cleanData = data.filter(row =>
        row.L_TYP_REG_DECHET === "DEEE" &&
        row.ANNEE === anneeChoisie
    );

    console.log("Filtered rows:", cleanData.length);
    console.log("Sample filtered:", cleanData.slice(0, 3));

    const minVal = d3.min(cleanData, d => parseFloat(d.TONNAGE_T.replace(",", ".")));
    const maxVal = d3.max(cleanData, d => parseFloat(d.TONNAGE_T.replace(",", ".")));

    console.log("Min tonnage:", minVal);
    console.log("Max tonnage:", maxVal);

    color.domain([minVal, maxVal]);

    d3.json("./data/departements-version-simplifiee.geojson").then(function (json) {

        console.log("GeoJSON features:", json.features.length);
        console.log("First feature:", json.features[0].properties);

        for (let j = 0; j < json.features.length; j++) {
            const departement = json.features[j].properties.code;

            const anneeDepChoisi = cleanData.find(row =>
                row.C_DEPT === departement
            );

            if (anneeDepChoisi) {
                json.features[j].properties.value =
                    parseFloat(anneeDepChoisi.TONNAGE_T.replace(",", "."));
            } else {
                json.features[j].properties.value = 0;
            }
        }

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
