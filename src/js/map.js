const d3 = require("d3");
const topojson = require("topojson");
class Map {
  width = window.innerWidth;
  height = window.innerHeight - 100;
  SCALE_MIN = 1;
  SCALE_MAX = 70000;
  SMALLEST_MARKER_PX = 1;
  BIGGEST_MARKER_PX = 60;
  FRAME_MS = 250;

  dateToDataMap = [];
  allDates = [];
  curDateIdx = 0;
  animatingHandle = 0;
  tooltipHoverId = -1;
  slider;

  setSlider(slider) {
    this.slider = slider;
  }

  setData({ allDates, dateToDataMap }) {
    this.allDates = allDates;
    this.dateToDataMap = dateToDataMap;
    this.curDateIdx = allDates.length - 1
    this.renderForState(true);
  }

  updateForDate(curDate) {
    if (this.curDateIdx !== this.allDates.indexOf(curDate)) {
      this.curDateIdx = this.allDates.indexOf(curDate);
      this.renderForState(true);
    }
  }
  constructor() {
    window.addEventListener("resize", this.resize);
    d3.select("#step").on("click", (d, i) => {
      this.incrementDate();
      this.renderForState(true);
    });

    d3.select("#prev").on("click", (d, i) => {
      this.decrementDate();
      this.renderForState();
    });

    d3.select("#animate").on("click", (d, i) => {
      this.toggleAnimation();
    });
  }

  setTopology(topology) {
    // Create the base map
    const geojson = topojson.feature(topology, topology.objects.countries);
    this.g
      .selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", this.path);
  }

  numWithCommas = x => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Modulo operation since ex. (-1 % 50) = -1, but we want it to be 49 for the current date
  mod = (n, m) => {
    return ((n % m) + m) % m;
  };

  resize = () => {
    this.svg.attr("width", window.innerWidth);
    this.svg.attr("height", window.innerHeight - 100);
  };

  toColor = d3
    .scaleSqrt()
    .domain([this.SCALE_MIN, this.SCALE_MAX / 2])
    .range(["#f1c40f", "#c0392b"]);

  sizeFunction = d3
    .scaleSqrt()
    .domain([this.SCALE_MIN, this.SCALE_MAX])
    .range([this.SMALLEST_MARKER_PX, this.BIGGEST_MARKER_PX]);
  // .clamp(true)

  toSize = x => (x == 0 ? 0 : this.sizeFunction(x));

  setScaling = scale => {
    this.sizeFunction
      .domain([this.SCALE_MIN, this.SCALE_MAX / (scale * scale)])
      .range([this.SMALLEST_MARKER_PX, this.BIGGEST_MARKER_PX / scale]);
  };

  projection = d3
    .geoMercator()
    .scale(200)
    .translate([this.width / 2, (3 * this.height) / 4]);

  path = d3.geoPath(this.projection);

  zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .on("zoom", this.zoomed.bind(this));

  zoomed() {
    this.g
      // .selectAll('path') // To prevent stroke width from scaling
      .attr("transform", d3.event.transform);
    this.setScaling(d3.event.transform.k);
    this.g.selectAll("circle").attr("r", d => this.toSize(d.confirmed));
  }

  svg = d3
    .select(".visual")
    .append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .call(this.zoom);

  g = this.svg.append("g");

  // Define the div for the tooltip
  tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    // Prevent padding from taking up space at the bottom of the page at the beginning
    .style("display", "none");

  incrementDate = () => {
    this.curDateIdx = this.mod(this.curDateIdx + 1, this.dateToDataMap.length);
  };

  decrementDate = () => {
    this.curDateIdx = this.mod(this.curDateIdx - 1, this.dateToDataMap.length);
  };

  toggleAnimation = () => {
    if (this.animatingHandle) {
      clearInterval(this.animatingHandle);
      this.animatingHandle = 0;
      d3.select("#animate").html("Animate");
    } else {
      this.animatingHandle = setInterval(() => {
        this.incrementDate();
        this.renderForState();
        // Update slider
        this.slider.update(
          this.slider.parseDate(this.allDates[this.curDateIdx])
        );
      }, this.FRAME_MS);
      d3.select("#animate").html("Stop");
    }
  };

  applyPropsToNodes = nodes => {
    const self = this;
    nodes
      .attr("transform", d => {
        return "translate(" + this.projection([d.long, d.lat]) + ")";
      })
      //add Tool Tip
      .on("mouseover", function(d) {
        self.tooltipHoverId = d.id;
        d3.select(this).classed("hover", true);
        self.tooltip
          .transition()
          .duration(500)
          .style("opacity", 0.9);
        self.tooltip
          .html(self.getTooltipText(d))
          .style("display", "block")
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY + "px");
      })
      .on("mousemove", function(d) {
        self.tooltip
          .style("left", d3.event.pageX + 10 + "px")
          .style("top", d3.event.pageY + 5 + "px");
      })
      .on("mouseout", function(d) {
        d3.select(this).classed("hover", false);
        self.tooltip
          .transition()
          .duration(1000)
          .style("opacity", 0)
          .on("end", () => {
            self.tooltipHoverId = -1;
          });
      });
  };

  getNumInfectedCountries = data => {
    return data
      .filter(obj => +obj.confirmed > 0)
      .map(obj => obj.country)
      .filter((val, i, arr) => arr.indexOf(val) === i);
  };

  getTooltipText = d =>
    `${d.province ? d.province + "<br/>" : ""}<b>${
      d.country
    }</b><br/>Confirmed: ${this.numWithCommas(
      d.confirmed
    )}<br/>Deaths: <span class="red">${this.numWithCommas(d.deaths)}<br/></span>
    Recovered: <span class="green">${this.numWithCommas(d.recovered)}</span>`;

  renderForState = animated => {
    const currentData = this.dateToDataMap[this.curDateIdx];
    const updates = this.g.selectAll("circle").data(currentData, d => d.id);

    updates
      .enter()
      .append("circle")
      .call(this.applyPropsToNodes)
      .merge(updates)
      .style("fill", d => this.toColor(d.confirmed));

    if (animated) {
      this.g
        .selectAll("circle")
        .transition()
        .attr("r", d => this.toSize(d.confirmed));
    } else {
      this.g.selectAll("circle").attr("r", d => this.toSize(d.confirmed));
    }
    updates.exit().remove();

    if (this.tooltipHoverId !== -1) {
      this.tooltip.html(this.getTooltipText(currentData[this.tooltipHoverId]));
    }
    // d3.select("#subtitle").html(this.allDates[this.curDateIdx]);

    // d3.select("#num-countries").html(`Number of countries affected: ${
    //   this.getNumInfectedCountries(currentData).length
    // }
    // `);
  };
}

export default Map;
