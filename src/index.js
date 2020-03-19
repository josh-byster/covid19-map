// Test import of a JavaScript function, an SVG, and Sass
import Map from "./js/map";
import Slider from "./js/slider";
import Panel from "./js/panel";
import "./styles/main.css";
import "./styles/slider.css";
import { fetchData, fetchTopology } from "./js/data";

const map = new Map();
const slider = new Slider();
map.setSlider(slider);
slider.setMap(map);
let panel;

Promise.all([fetchData, fetchTopology]).then(([data, topology]) => {
  map.setTopology(topology);
  map.setData(data);
  slider.setDateRange(data.startDate, data.endDate);
  panel = new Panel(data.totals,data.allDates);
  map.setPanel(panel);
});
