var formatBottomDate = d3.timeFormat("%b %d");
var formatSliderDate = d3.timeFormat("%b %-d");
var parseDate = d3.timeParse("%m/%d/%y");

var startDate = d3.timeParse("%Y-%m-%d")("2020-01-23"),
  endDate = d3.timeParse("%Y-%m-%d")("2020-03-16");

var margin = { top: 0, right: 50, bottom: 0, left: 50 },
  sliderWidth = 500 - margin.left - margin.right,
  sliderHeight = 200 - margin.top - margin.bottom;

var sliderSvg = d3
  .select("#vis")
  .append("svg")
  .attr("width", sliderWidth + margin.left + margin.right)
  .attr("height", sliderHeight + margin.top + margin.bottom);

var moving = false;
var currentValue = 0;
var targetValue = sliderWidth;

var playButton = d3.select("#play-button");

var x = d3
  .scaleTime()
  .domain([startDate, endDate])
  .range([0, targetValue])
  .clamp(true);

  console.log(x.domain())
var slider = sliderSvg
  .append("g")
  .attr("class", "slider")
  .attr("transform", "translate(" + margin.left + "," + 0 / 5 + ")");

slider
  .append("line")
  .attr("class", "track")
  .attr("x1", x.range()[0])
  .attr("x2", x.range()[1])
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
        slider.interrupt();
      })
      .on("start drag", function() {
        currentValue = d3.event.x;
        update(x.invert(currentValue));
      })
  );

slider
  .insert("g", ".track-overlay")
  .attr("class", "ticks")
  .attr("transform", "translate(0," + 18 + ")")
  .selectAll("text")
  .data(x.ticks(4))
  .enter()
  .append("text")
  .attr("x", x)
  .attr("y", 10)
  .attr("text-anchor", "middle")
  .text(function(d) {
    return formatBottomDate(d);
  });

var handle = slider
  .insert("circle", ".track-overlay")
  .attr("class", "handle")
  .attr("r", 15);

var label = slider
  .append("text")
  .attr("class", "label")
  .attr("text-anchor", "middle")
  .text(formatSliderDate(startDate))
  .attr("transform", "translate(0," + -25 + ")");

function update(h) {
  // update position and text of label according to slider scale
  handle.attr("cx", x(h));
  label.attr("x", x(h)).text(formatSliderDate(h));
  const curDate = d3.timeFormat("%-m/%-d/%y")(h);
  if(curDateIdx !== allDates.indexOf(curDate)){

 
    curDateIdx =  allDates.indexOf(curDate);
    console.log(curDateIdx)
    renderForState(true)
}
}
