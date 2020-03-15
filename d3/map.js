const width = 1400,
  height = 800;
const CUR_DATE = "3/13/20";
const MIN = 0;
const MAX = 70000;
const TOPOLOGY_LINK =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";

const CONFIRMED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

let dateList = [];
let allDates = [];
let curDateIdx = 30;

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

const getDataForDate = (data, date) =>
  data
    .filter(d => d[date] > 0)
    .map(d => ({
      lat: d.Lat,
      long: d.Long,
      country: d["Country/Region"],
      count: d[date],
      province: d["Province/State"]
    }));

const updateDateMap = data => {
  allDates = Object.keys(data[0]).slice(4);
  dateList = allDates.map(curDate => getDataForDate(data, curDate));
};

const incrementDate = () => {
  curDateIdx = (curDateIdx + 1) % dateList.length;
  console.log(`Cur date idx now set to ${curDateIdx}`);
}
d3.select("#step").on("click", function(d, i) {
  incrementDate();
  renderForState();
});

const applyPropsToNodes = (nodes) => {
  nodes
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
      console.log("Mouse over!")
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
      console.log("Mouse exit")
      d3.select(this).classed("hover", false);
      tooltip
        .transition()
        .duration(500)
        .style("opacity", 0);
    });
}

const renderForState = () => {
  const updates = svg.selectAll("circle").data(dateList[curDateIdx]);
  updates.enter().append("circle").call(applyPropsToNodes);
  updates.attr("r", function(d) {
    const t = d3
      .scaleSqrt()
      .domain([MIN, MAX])
      .range([0, 100]);
    return t(d.count);
    // return radius(d.properties.population); //radius const with input (domain) and output (range)
  })    .attr("transform", function(d) {
    return "translate(" + projection([d.long, d.lat]) + ")";
  })    .attr("fill", d => {
    return toColor(d.count);
  });
  updates.exit().remove();
  console.log(updates)
};

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
    updateDateMap(data);
    svg.append("g").attr("class", "bubble");

    // setInterval(() => {incrementDate(); renderForState(); } ,500);
    renderForState();
  });
