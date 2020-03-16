const width = 1000,
  height = 600;
const SCALE_MIN = 0;
const SCALE_MAX = 70000;
const BIGGEST_MARKER_PX = 50;
const TOPOLOGY_LINK =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CONFIRMED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

let dateList = [];
let allDates = [];
let curDateIdx = 0;
let animatingHandle = 0;

const numWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Modulo operation since ex. (-1 % 50) = -1, but we want it to be 49 for the current date
const mod = (n, m) => {
  return ((n % m) + m) % m;
};

const toColor = d3
  .scaleSequentialSqrt(d3.interpolateYlOrRd)
  .domain([SCALE_MIN, 35000]);

const projection = d3
  .geoMercator()
  .scale(150)
  .translate([width / 2, (3 * height) / 4]);

const path = d3.geoPath(projection);

const zoom = d3
  .zoom()
  .scaleExtent([1, 8])
  .on("zoom", zoomed);

function zoomed() {
  g
    // .selectAll('path') // To prevent stroke width from scaling
    .attr("transform", d3.event.transform);
}

const svg = d3
  .select(".visual")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(zoom);

const g = svg.append("g");

// Define the div for the tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  // Prevent padding from taking up space at the bottom of the page at the beginning
  .style("display", "none");

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
  curDateIdx = mod(curDateIdx + 1, dateList.length);
  console.log(`Cur date idx now set to ${curDateIdx}`);
};

const decrementDate = () => {
  curDateIdx = mod(curDateIdx - 1, dateList.length);
  console.log(`Cur date idx now set to ${curDateIdx}`);
};

d3.select("#step").on("click", function(d, i) {
  incrementDate();
  renderForState();
});

d3.select("#prev").on("click", function(d, i) {
  decrementDate();
  renderForState();
});

const toggleAnimation = () => {
  if (animatingHandle) {
    clearInterval(animatingHandle);
    animatingHandle = 0;
  } else {
    animatingHandle = setInterval(() => {
      incrementDate();
      renderForState();
    }, 100);
  }
};

d3.select("#animate").on("click", (d, i) => {
  toggleAnimation();
});

const applyPropsToNodes = nodes => {
  nodes
    .attr("transform", function(d) {
      return "translate(" + projection([d.long, d.lat]) + ")";
    })
    //add Tool Tip
    .on("mouseover", function(d) {
      console.log("Mouse over!");
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
        .style("display", "block")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px");
    })
    .on("mouseout", function(d) {
      console.log("Mouse exit");
      d3.select(this).classed("hover", false);
      tooltip
        .transition()
        .duration(500)
        .style("opacity", 0);
    });
};

const getNumInfectedCountries = data => {
  return data
    .map(obj => obj.country)
    .filter((val, i, arr) => arr.indexOf(val) === i);
};
const renderForState = () => {
  const updates = g
    .selectAll("circle")
    .data(dateList[curDateIdx], d => `${d.lat}${d.long}`);
  updates
    .enter()
    .append("circle")
    .call(applyPropsToNodes)
    .merge(updates)
    .attr("r", function(d) {
      const t = d3
        .scaleSqrt()
        .domain([SCALE_MIN, SCALE_MAX])
        .range([0, BIGGEST_MARKER_PX]);
      return t(d.count);
      // return radius(d.properties.population); //radius const with input (domain) and output (range)
    })
    .attr("fill", d => {
      return toColor(d.count);
    });
  updates.exit().remove();
  d3.select("#subtitle").html(allDates[curDateIdx]);

  d3.select("#num-countries").html(`Number of countries affected: ${
    getNumInfectedCountries(dateList[curDateIdx]).length
  }
    `);
};

d3.json(TOPOLOGY_LINK)
  .then(topology => {
    // Create the base map
    const geojson = topojson.feature(topology, topology.objects.countries);
    g.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", path);
  })
  .then(() => d3.csv(CONFIRMED_CASES_LINK))
  .then(data => {
    updateDateMap(data);
    renderForState();
  });
