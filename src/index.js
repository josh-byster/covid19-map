// Test import of a JavaScript function, an SVG, and Sass
import Map from "./js/map";
import Slider from "./js/slider";
import Panel from "./js/panel";
import Plot from "./js/plot";
import "./styles/main.css";
import "./styles/slider.css";
import "./styles/plot.css"
import { fetchData, fetchTopology } from "./js/data";

const map = new Map();
const slider = new Slider();
map.setSlider(slider);
slider.setMap(map);
let panel;
let plot;

Promise.all([fetchData, fetchTopology]).then(([data, topology]) => {
  map.setTopology(topology);
  map.setData(data);
  slider.setDateRange(data.startDate, data.endDate);
  panel = new Panel(data.totals,data.allDates);
  plot = new Plot(data);
  map.setPanel(panel);
  map.setPlot(plot);
});
