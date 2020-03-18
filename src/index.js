// Test import of a JavaScript function, an SVG, and Sass
import Map from "./js/map";
import Slider from "./js/slider";
import WebpackLogo from "./images/webpack-logo.svg";
import "./styles/main.css";
import "./styles/slider.css";
import { fetchData, fetchTopology } from "./js/data";
const d3 = require("d3");

const map = new Map();
const slider = new Slider();
map.setSlider(slider);
slider.setMap(map);

const kFormatter = num =>
  Math.abs(num) > 999
    ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k"
    : num.toFixed(0);

Promise.all([fetchData, fetchTopology]).then(([data, topology]) => {
  map.setTopology(topology);
  map.setData(data);
  slider.setDateRange(data.startDate, data.endDate);
  d3.select("#total")
    .transition()
    .duration(4000)
    .delay(0)
    .tween("text", function(d) {
      const i = d3.interpolate(0, data.totalCases);
      return function(t) {
      d3.select(this).text(`~${kFormatter(i(t))}`);
      };
    });
});
