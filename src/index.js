// Test import of a JavaScript function, an SVG, and Sass
import Map from "./js/map";
import Slider from "./js/slider";
import WebpackLogo from "./images/webpack-logo.svg";
import "./styles/main.css";
import "./styles/slider.css";
import { fetchData, fetchTopology } from "./js/data";

const map = new Map();
const slider = new Slider(map);
map.setSlider(slider);

Promise.all([fetchData, fetchTopology]).then(([data, topology]) => {
  map.setTopology(topology);
  map.setData(data);
});
