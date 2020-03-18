const d3 = require("d3");
class Slider {
  formatBottomDate = d3.timeFormat("%b %-d");
  formatSliderDate = d3.timeFormat("%b %-d");
  parseDate = d3.timeParse("%m/%d/%y");

  startDate = d3.timeParse("%Y-%m-%d")("2020-01-22");
  endDate = d3.timeParse("%Y-%m-%d")("2020-03-17");

  computeDimensions = () => {
    return {
      width:
        Math.min(500, window.innerWidth) - this.margin.left - this.margin.right,
      height: 200 - this.margin.top - this.margin.bottom
    };
  };

  margin = { top: 0, right: 50, bottom: 0, left: 50 };
  sliderWidth = this.computeDimensions().width;

  sliderHeight = this.computeDimensions().height;

  sliderSvg = d3
    .select("#vis")
    .append("svg")
    .attr("width", this.sliderWidth + this.margin.left + this.margin.right)
    .attr("height", this.sliderHeight + this.margin.top + this.margin.bottom);

  moving = false;
  currentValue = 0;
  targetValue = this.sliderWidth;
  map;
  playButton = d3.select("#play-button");
  getNumTicks = () => (this.computeDimensions().width > 300 ? 4 : 2);

  x = d3
    .scaleTime()
    .domain([this.startDate, this.endDate])
    .range([0, this.targetValue])
    .clamp(true);

  slider = this.sliderSvg
    .append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + this.margin.left + "," + 0 / 5 + ")");

  // Slider responsiveness
  resize = () => {
    this.sliderSvg.attr(
      "width",
      this.computeDimensions().width + this.margin.left + this.margin.right
    );
    this.sliderSvg.attr(
      "height",
      this.computeDimensions().height + this.margin.top + this.margin.bottom
    );

    // Before the scale
    const oldX = d3
      .scaleTime()
      .domain(this.x.domain())
      .range(this.x.range())
      .clamp(true);

    this.x.range([0, this.computeDimensions().width]);
    d3.select(".track")
      .attr("x1", this.x.range()[0])
      .attr("x2", this.x.range()[1]);
    d3.select(".track-inset")
      .attr("x1", this.x.range()[0])
      .attr("x2", this.x.range()[1]);
    d3.select(".track-overlay")
      .attr("x1", this.x.range()[0])
      .attr("x2", this.x.range()[1]);
    const t = d3
      .select(".ticks")
      .selectAll("text")
      .data(this.x.ticks(this.getNumTicks()));

    t.enter()
      .append("text")
      .merge(t)
      .attr("x", this.x)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .text(d => {
        return this.formatBottomDate(d);
      });

    t.exit().remove();

    const convertToNew = t => this.x(oldX.invert(t));

    const currentHandlePos = this.handle.attr("cx");
    const newHandlePos = convertToNew(currentHandlePos);
    const currentLabelPos = this.label.attr("x");
    this.handle.attr("cx", newHandlePos);
    this.label
      .attr("x", convertToNew(currentLabelPos))
      .text(this.formatSliderDate(this.x.invert(newHandlePos)));
  };

  constructor(map) {
    window.addEventListener("resize", this.resize);
    this.map = map;
    const self = this;
    this.slider
      .append("line")
      .attr("class", "track")
      .attr("x1", this.x.range()[0])
      .attr("x2", this.x.range()[1])
      .select(function() {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr("class", "track-inset")
      .select(function() {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr("class", "track-overlay")
      .call(
        d3
          .drag()
          .on("start.interrupt", function() {
            self.slider.interrupt();
          })
          .on("start drag", function() {
            self.currentValue = d3.event.x;
            self.update(self.x.invert(self.currentValue));
          })
      );

    this.slider
      .insert("g", ".track-overlay")
      .attr("class", "ticks")
      .attr("transform", "translate(0," + 18 + ")")
      .selectAll("text")
      .data(this.x.ticks(this.getNumTicks()))
      .enter()
      .append("text")
      .attr("x", this.x)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .text(d => {
        return this.formatBottomDate(d);
      });

    this.handle = this.slider
      .insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("r", 15)
      .attr("cx", 0)
      .call(x => {});

    this.label = this.slider
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .text(this.formatSliderDate(this.startDate))
      .attr("transform", "translate(0," + -25 + ")")
      .attr("x", 0);
  }

  update(h) {
    // update position and text of label according to slider scale
    this.handle.attr("cx", this.x(h));
    this.label.attr("x", this.x(h)).text(this.formatSliderDate(h));
    const curDate = d3.timeFormat("%-m/%-d/%y")(h);
    if (this.map.curDateIdx !== this.map.allDates.indexOf(curDate)) {
      this.map.curDateIdx = this.map.allDates.indexOf(curDate);
      this.map.renderForState(true);
    }
  }
}

export default Slider;
