const d3 = require("d3");
const topojson = require("topojson");

class Map {
  width = window.innerWidth;
  height = window.innerHeight - 100;
  SCALE_MIN = 1;
  SCALE_MAX = 120000;
  SMALLEST_MARKER_PX = 1;
  BIGGEST_MARKER_PX = 30;
  FRAME_MS = 250;
  MIN_CASES_SHOWN = 10;

  dateToDataMap = [];
  allDates = [];
  curDateIdx = 0;
  animatingHandle = 0;
  tooltipHoverId = -1;
  slider;

  setSlider(slider) {
    this.slider = slider;
  }

  setPanel(panel) {
    this.panel = panel;
  }

  setData({ allDates, dateToDataMap, confirmedWithIndices }) {
    this.allDates = allDates;
    this.dateToDataMap = dateToDataMap;
    this.curDateIdx = allDates.length - 1;
    this.confirmed = confirmedWithIndices;
    this.renderForState(true, 2000, 1000);
  }

  updateForDate(curDate) {
    if (this.curDateIdx !== this.allDates.indexOf(curDate)) {
      const prev = this.curDateIdx;
      this.curDateIdx = this.allDates.indexOf(curDate);
      this.renderForState(true);
      this.panel.renderTotalCases(
        true,
        this.allDates[prev],
        this.allDates[this.curDateIdx]
      );
    }
  }
  constructor() {
    window.addEventListener("resize", this.resize);
    const self = this;
    d3.select("body").on("keydown", function () {
      const prev = self.allDates[self.curDateIdx];
      if (d3.event.keyCode === 39) {
        // Right arrow
        self.incrementDate();
        self.renderForState(true);
        self.updateSlider();
        self.panel.renderTotalCases(true, prev, self.allDates[self.curDateIdx]);
      } else if (d3.event.keyCode === 37) {
        // Left arrow
        self.decrementDate();
        self.renderForState(true);
        self.updateSlider();
        self.panel.renderTotalCases(true, prev, self.allDates[self.curDateIdx]);
      } else if (d3.event.keyCode === 32) {
        self.toggleAnimation();
      }
    });

    d3.select("#step").on("click", () => {
      this.incrementDate();
      this.renderForState(true);
    });

    d3.select("#prev").on("click", () => {
      this.decrementDate();
      this.renderForState();
    });

    d3.select("#animate").on("click", () => {
      this.toggleAnimation();
    });
  }

  setTopology(topology) {
    // Create the base map
    let geojson;
    let object;

    if (topology.objects.states) {
      geojson = topojson.feature(topology, topology.objects.states);
      object = this.states;
    } else {
      geojson = topojson.feature(topology, topology.objects.countries);
      object = this.countries;
    }
    const pathObj = object.selectAll("path").data(geojson.features);

    pathObj
      .enter()
      .append("path")
      .attr("d", this.path)
      .style("opacity", 0)
      .transition()
      .ease(d3.easeCubicIn)
      .duration(1000)
      .style("opacity", 1);
  }

  numWithCommas = (x) => {
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
    .scaleSequentialLog()
    .domain([this.SCALE_MIN, this.SCALE_MAX / 4])
    .interpolator(d3.interpolateRdPu);
  // .clamp(true);

  sizeFunction = d3
    .scaleSqrt()
    .domain([this.SCALE_MIN, this.SCALE_MAX])
    .range([this.SMALLEST_MARKER_PX, this.BIGGEST_MARKER_PX])
    .clamp(true);

  toSize = (x) => (x == 0 ? 0 : this.sizeFunction(x));

  setScaling = (scale) => {
    this.sizeFunction
      .domain([this.SCALE_MIN, this.SCALE_MAX])
      .range([
        this.SMALLEST_MARKER_PX / Math.sqrt(scale),
        this.BIGGEST_MARKER_PX / Math.sqrt(scale),
      ]);
  };

  projection = d3
    .geoMercator()
    .scale(225)
    .center([-30, 0])
    .translate([this.width / 2, (3 * this.height) / 4]);

  path = d3.geoPath(this.projection);

  zoom = d3
    .zoom()
    .scaleExtent([1, 100])
    .translateExtent([
      [-500, -100],
      [1800, 1000],
    ])
    .on("zoom", this.zoomed.bind(this));

  zoomed() {
    this.g
      // .selectAll('path') // To prevent stroke width from scaling
      .attr("transform", d3.event.transform);
    this.setScaling(d3.event.transform.k);
    this.g.selectAll("circle").attr("r", (d) => this.toSize(d.confirmed));
  }

  svg = d3
    .select(".visual")
    .append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .call(this.zoom);

  g = this.svg.append("g");

  countries = this.g.append("g").classed("countries", true);
  states = this.g.append("g").classed("states", true);

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
        const prev = this.allDates[this.curDateIdx];
        this.incrementDate();
        this.renderForState();
        this.updateSlider();
        this.panel.renderTotalCases(
          false,
          prev,
          this.allDates[this.curDateIdx]
        );
      }, this.FRAME_MS);
      d3.select("#animate").html("Stop");
    }
  };

  updateSlider() {
    this.slider.update(this.slider.parseDate(this.allDates[this.curDateIdx]));
  }

  applyPropsToNodes = (nodes) => {
    const self = this;
    nodes
      .attr("transform", (d) => {
        return "translate(" + this.projection([d.long, d.lat]) + ")";
      })
      //add Tool Tip
      .on("mouseover", function (d) {
        self.tooltipHoverId = d.id;
        d3.select(this).classed("hover", true);
        self.tooltip.transition().duration(500).style("opacity", 0.9);
        self.tooltip
          .html(self.getTooltipText(d))
          .style("display", "block")
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY + "px");
      })
      .on("mousemove", function () {
        self.tooltip
          .style("left", d3.event.pageX + 10 + "px")
          .style("top", d3.event.pageY + 5 + "px");
      })
      .on("mouseout", function (d) {
        d3.select(this).classed("hover", false);
        if (self.tooltipHoverId == d.id) {
          self.tooltipHoverId = -1;
        }
        self.hideTooltip();
      });
  };

  hideTooltip = () => {
    const self = this;
    this.tooltip
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .on("end", function () {
        self.tooltipHoverId = -1;
      });
  };
  getNumInfectedCountries = (data) => {
    return data
      .filter((obj) => +obj.confirmed > 0)
      .map((obj) => obj.country)
      .filter((val, i, arr) => arr.indexOf(val) === i);
  };

  getElemForId = (data, id) => data.find((d) => d.id === id);

  getTooltipText = (d) =>
    `${d.province ? d.province + "<br/>" : ""}<b><span class="countryname">${
      d.country
    }</span></b><br/>Total: ${this.numWithCommas(d.confirmed)}<br/>
    Deaths: <span class="orange">${this.numWithCommas(d.deaths)}</span>
    `;

  renderForState = (animated, duration = 250, delay = 0) => {
    const currentData = this.dateToDataMap[this.curDateIdx];
    // Filter out cases that don't hit the minimum threshold or don't have geo coords
    const visibleNodes = currentData.filter(
      (d) => d.confirmed > this.MIN_CASES_SHOWN && d.lat != 0
    );
    const updates = this.g.selectAll("circle").data(visibleNodes, (d) => d.id);

    updates
      .enter()
      .append("circle")
      .call(this.applyPropsToNodes)
      .merge(updates)
      .style("fill", (d) => this.toColor(d.confirmed));

    if (animated) {
      this.g
        .selectAll("circle")
        .transition()
        .duration(duration)
        .delay(delay)
        .attr("r", (d) => this.toSize(d.confirmed));
    } else {
      this.g.selectAll("circle").attr("r", (d) => this.toSize(d.confirmed));
    }
    updates.exit().remove();

    if (!this.getElemForId(visibleNodes, this.tooltipHoverId)) {
      this.hideTooltip();
    }

    if (this.tooltipHoverId !== -1) {
      this.tooltip.html(
        this.getTooltipText(this.getElemForId(currentData, this.tooltipHoverId))
      );
    }
  };
}

export default Map;
