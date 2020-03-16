const width = window.innerWidth,
  height = window.innerHeight;
const SCALE_MIN = 0;
const SCALE_MAX = 70000;
const BIGGEST_MARKER_PX = 50;
const FRAME_MS = 30;
const TOPOLOGY_LINK =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CONFIRMED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

let dateToDataMap = [];
let allDates = [];
let curDateIdx = 0;
let animatingHandle = 0;
let tooltipHoverId = -1;

const numWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Modulo operation since ex. (-1 % 50) = -1, but we want it to be 49 for the current date
const mod = (n, m) => {
  return ((n % m) + m) % m;
};

const resize = () => {
  console.log(svg)
  svg.attr("width",window.innerWidth)
  svg.attr('height',window.innerHeight)
}

window.addEventListener("resize", resize);
const toColor = d3
  .scaleSqrt()
  .domain([SCALE_MIN, SCALE_MAX/2]).range(["#f1c40f","#c0392b"])

const toSize = d3
  .scaleSqrt()
  .domain([SCALE_MIN, SCALE_MAX])
  .range([0, BIGGEST_MARKER_PX]);

const setScaling = (scale) => {
  toSize
    .domain([SCALE_MIN, SCALE_MAX / (scale * scale)])
    .range([0, BIGGEST_MARKER_PX / scale]);
};

const projection = d3
  .geoMercator()
  .scale(200)
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
  setScaling(d3.event.transform.k);
  g.selectAll("circle").attr("r", d => toSize(d.count));
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
  data.map(d => ({
    id: d.id,
    lat: d.Lat,
    long: d.Long,
    country: d["Country/Region"],
    count: d[date],
    province: d["Province/State"]
  }));

const loadData = data => {
  const dataWithIndices = data.map((row, idx) => ({ id: idx, ...row }));
  allDates = Object.keys(dataWithIndices[0]).slice(5);
  dateToDataMap = allDates.map(curDate =>
    getDataForDate(dataWithIndices, curDate)
  );
};

const incrementDate = () => {
  curDateIdx = mod(curDateIdx + 1, dateToDataMap.length);
  console.log(`Cur date idx now set to ${curDateIdx}`);
};

const decrementDate = () => {
  curDateIdx = mod(curDateIdx - 1, dateToDataMap.length);
  console.log(`Cur date idx now set to ${curDateIdx}`);
};

d3.select("#step").on("click", (d, i) => {
  incrementDate();
  renderForState(true);
});

d3.select("#prev").on("click", (d, i) => {
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
    }, FRAME_MS);
  }
};

d3.select("#animate").on("click", (d, i) => {
  toggleAnimation();
});

const applyPropsToNodes = nodes => {
  nodes
    .attr("transform", d => {
      return "translate(" + projection([d.long, d.lat]) + ")";
    })
    //add Tool Tip
    .on("mouseover", function(d) {
      tooltipHoverId = d.id;
      d3.select(this).classed("hover", true);
      tooltip
        .transition()
        .duration(500)
        .style("opacity", 0.9);
      tooltip
        .html(getTooltipText(d))
        .style("display", "block")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px");
    })
    .on("mousemove", function(d) {
     tooltip.style("left", d3.event.pageX + 10 + "px")
     .style("top", d3.event.pageY + 5 + "px"); 
    })
    .on("mouseout", function(d) {
      console.log("Mouse exit");
      d3.select(this).classed("hover", false);
      tooltip
        .transition()
        .duration(1000)
        .style("opacity", 0)
        .on("end", () => {
          tooltipHoverId = -1;
        });
    });
};

const getNumInfectedCountries = data => {
  return data
    .filter(obj => +obj.count > 0)
    .map(obj => obj.country)
    .filter((val, i, arr) => arr.indexOf(val) === i);
};

const getTooltipText = d =>
  `${d.province ? d.province + "<br/>" : ""}<b>${
    d.country
  }</b><br/>Confirmed: ${numWithCommas(d.count)}`;

const renderForState = (animated) => {
  const currentData = dateToDataMap[curDateIdx];
  const updates = g.selectAll("circle").data(currentData, d => d.id);

  updates
    .enter()
    .append("circle")
    .call(applyPropsToNodes)
    .merge(updates)
    .style("fill", d => toColor(d.count));

  if(animated){
    console.log("Hi")
    g.selectAll("circle").transition().attr("r", d => toSize(d.count))
  } else {
    console.log("Bye")
    g.selectAll("circle").attr("r", d => toSize(d.count))
  }
  updates.exit().remove();

  if (tooltipHoverId !== -1) {
    tooltip.html(getTooltipText(currentData[tooltipHoverId]));
  }
  d3.select("#subtitle").html(allDates[curDateIdx]);

  d3.select("#num-countries").html(`Number of countries affected: ${
    getNumInfectedCountries(currentData).length
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
    loadData(data);
    renderForState();
  });
