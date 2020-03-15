const width = 1400,
  height = 800;
const CUR_DATE = "3/13/20";
const MIN = 0;
const MAX = 70000;
const TOPOLOGY_LINK = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";

const CONFIRMED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";
const numWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const toColor = d3
  .scaleSequentialSqrt(d3.interpolateYlOrRd)
  .domain([MIN, 35000]);

const projection = d3
  .geoMercator()
  .scale(200)
  .translate([width / 2, height / 2]);

const path = d3.geoPath(projection);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Define the div for the tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


d3.json(TOPOLOGY_LINK)
  .then(topology => {
    // Create the base map
    const geojson = topojson.feature(topology, topology.objects.countries);
    svg
      .selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", path);
  })
  .then(() => d3.csv(CONFIRMED_CASES_LINK))
  .then(data => {
    const filtered = data
      .filter(d => d[CUR_DATE] > 0)
      .map(d => ({
        lat: d.Lat,
        long: d.Long,
        country: d["Country/Region"],
        count: d[CUR_DATE],
        province: d["Province/State"]
      }));
    console.log(filtered);
    svg
      .append("g")
      .attr("class", "bubble")
      .selectAll("circle")
      .data(filtered)
      .enter()
      .append("circle")
      .attr("r", function(d) {
        const t = d3
          .scaleSqrt()
          .domain([MIN, MAX])
          .range([0, 100]);
        return t(d.count);
        // return radius(d.properties.population); //radius const with input (domain) and output (range)
      })
      .attr("transform", function(d) {
        return "translate(" + projection([d.long, d.lat]) + ")";
      })
      .attr("fill", d => {
        return toColor(d.count);
      })
      //add Tool Tip
      .on("mouseover", function(d) {
        d3.select(this).classed("hover", true);
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(
            `${d.province ? d.province + "<br/>" : ""}${
              d.country
            }<br/>Confirmed: ${numWithCommas(d.count)}`
          )
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY + "px");
      })
      .on("mouseout", function(d) {
        d3.select(this).classed("hover", false);
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
      });
  });
