class Slider {
  formatBottomDate = d3.timeFormat("%b %-d");
  formatSliderDate = d3.timeFormat("%b %-d");
  parseDate = d3.timeParse("%m/%d/%y");

  startDate = d3.timeParse("%Y-%m-%d")("2020-01-23");
  endDate = d3.timeParse("%Y-%m-%d")("2020-03-16");

  margin = { top: 0, right: 50, bottom: 0, left: 50 };
  sliderWidth = 500 - this.margin.left - this.margin.right;
  sliderHeight = 200 - this.margin.top - this.margin.bottom;

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

  x = d3
    .scaleTime()
    .domain([this.startDate, this.endDate])
    .range([0, this.targetValue])
    .clamp(true);

  slider = this.sliderSvg
    .append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + this.margin.left + "," + 0 / 5 + ")");

  constructor(map) {
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
      .data(this.x.ticks(4))
      .enter()
      .append("text")
      .attr("x", this.x)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .text(d => {
        return this.formatBottomDate(d);
      });
  }

  handle = this.slider
    .insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 15);

  label = this.slider
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .text(this.formatSliderDate(this.startDate))
    .attr("transform", "translate(0," + -25 + ")");

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
