// Test import of a JavaScript function, an SVG, and Sass
import Map from "./js/map";
import Slider from "./js/slider";
import "./styles/main.css";
import "./styles/slider.css";
import { fetchData, fetchTopology, kFormatter } from "./js/data";
const d3 = require("d3");

const map = new Map();
const slider = new Slider();
map.setSlider(slider);
slider.setMap(map);



Promise.all([fetchData, fetchTopology]).then(([data, topology]) => {
  map.setTopology(topology);
  map.setData(data);
  slider.setDateRange(data.startDate, data.endDate);
  d3.select("#total")
    .transition()
    .duration(4000)
    .delay(500)
    .tween("text", function() {
      const i = d3.interpolate(0, data.totalCases);
      return function(t) {
      d3.select(this).text(`~${kFormatter(i(t))}`);
      };
    });
});
