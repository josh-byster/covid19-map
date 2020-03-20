import { max } from "d3";

const d3 = require("d3");
// 2. Use the margin convention practice

class Plot {
  margin = { top: 50, right: 50, bottom: 50, left: 50 };
  width = 200 - this.margin.left - this.margin.right; // Use the window's width
  height = 200 - this.margin.top - this.margin.bottom; // Use the window's height

  constructor({ allDates, dateToDataMap }) {
    this.allDates = allDates;
    this.dateToDataMap = dateToDataMap;
    // 1. Add the SVG to the page and employ #2
    this.svg = d3
      .select(".graph")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    const n = 21;

    // 5. X scale will use the index of our data
    this.xScale = d3
      .scaleLinear()
      .domain([0, allDates.length]) // input
      .range([0, this.width]); // output

    // 6. Y scale will use the randomly generate number
    this.yScale = d3
      .scaleLinear()
      .domain([0, 70000]) // input
      .range([this.height, 0]); // output

    // 3. Call the x axis in a group tag
    this.xAxis = this.svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.xScale)); // Create an axis component with d3.axisBottom

    // 4. Call the y axis in a group tag
    this.yAxis = this.svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(this.yScale)); // Create an axis component with d3.axisLeft
  }

  computePlotValsForId(id) {
    const [confirmed, recovered, deaths] = [
      "confirmed",
      "recovered",
      "deaths"
    ].map(cur => {
      return this.dateToDataMap.map(data => {
        return +data[id][cur];
      });
    });
    return {confirmed,recovered,deaths}
  }
  clear() {
    console.log(this.svg.select("path"));
    this.svg.select(".line").remove();
    this.svg.selectAll(".dot").remove();
  }
  plot(id) {
    const {confirmed, recovered, deaths} = this.computePlotValsForId(id);
    this.yScale.domain([0,max(confirmed)])
    this.yAxis.call(d3.axisLeft(this.yScale));
    console.log(confirmed);
    this.clear();
    // The number of datapoints

    const self = this;
    // 7. d3's line generator
    const line = d3
      .line()
      .x(function(d, i) {
        return self.xScale(i);
      }) // set the x values for the line generator
      .y(function(d) {
        return self.yScale(d);
      }) // set the y values for the line generator
      .curve(d3.curveMonotoneX); // apply smoothing to the line

    // // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
    // const dataset = d3.range(21).map(function() {
    //   return { y: d3.randomUniform(1)() };
    // });

    // 9. Append the path, bind the data, and call the line generator
    this.svg
      .append("path")
      .datum(confirmed) // 10. Binds data to the line
      .attr("class", "line") // Assign a class for styling
      .attr("d", line); // 11. Calls the line generator

    // 12. Appends a circle for each datapoint
    this.svg
      .selectAll(".dot")
      .data(confirmed)
      .enter()
      .append("circle") // Uses the enter().append() method
      .attr("class", "dot") // Assign a class for styling
      .attr("cx", function(_, i) {
        return self.xScale(i);
      })
      .attr("cy", function(d) {
        return self.yScale(d);
      })
      .attr("r", 3)
      .on("mouseover", function() {})
      .on("mouseout", function() {});
  }
}

export default Plot;
