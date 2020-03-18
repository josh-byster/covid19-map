// Test import of a JavaScript function, an SVG, and Sass
import Map from "./js/map";
import Slider from "./js/slider";
import WebpackLogo from "./images/webpack-logo.svg";
import "./styles/main.css";
import "./styles/slider.css";
import { fetchData, fetchTopology } from "./js/data";

const map = new Map();
const slider = new Slider();
map.setSlider(slider);
slider.setMap(map);

Promise.all([fetchData, fetchTopology]).then(([data, topology]) => {
  map.setTopology(topology);
  map.setData(data);
    console.log()
  slider.setDateRange(data["allDates"][0], data["allDates"][data["allDates"].length-1])
});
