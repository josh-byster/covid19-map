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
      "deaths",
      "active"
    ].map(cur => {
      return this.dateToDataMap.map(data => {
        return +data[id][cur];
      });
    });

    const active = confirmed.map((total, i) => {
      return total - recovered[i] - deaths[i];
    });
    return { confirmed, recovered, deaths, active };
  }
  clear() {
    console.log(this.svg.select("path"));
    this.svg.selectAll(".line").remove();
    this.svg.selectAll(".dot").remove();
  }

  appendToPlot(data, color) {
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

    // 9. Append the path, bind the data, and call the line generator
    this.svg
      .append("path")
      .datum(data) // 10. Binds data to the line
      .attr("class", `line ${color}`) // Assign a class for styling
      .attr("d", line); // 11. Calls the line generator

  }

  plot(id) {
    const { confirmed, active, recovered, deaths } = this.computePlotValsForId(
      id
    );
    this.yScale.domain([0, max(active.concat(recovered,deaths))]);
    this.yAxis.call(d3.axisLeft(this.yScale));
    this.clear();
    // The number of datapoints

    this.appendToPlot(active, "orange");
    this.appendToPlot(recovered, "green");
    this.appendToPlot(deaths,  "red");
  }
}

export default Plot;
