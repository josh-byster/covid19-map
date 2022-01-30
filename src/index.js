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

Promise.all([fetchData, fetchTopology]).then(
  ([data, [countryTop]]) => {
    map.setTopology(countryTop);
    map.setData(data);
    slider.setDateRange(data.startDate, data.endDate);
    panel = new Panel(data.totals, data.allDates);
    map.setPanel(panel);
  }
);

const togglePanel = () => {
  const panel = document.getElementById("panel");
  const btn = document.getElementById("toggle-collapse");
  const slider = document.getElementById("slider");
  [panel, slider, btn].forEach((t) => t.classList.toggle("panel-collapsed"));
  if (panel.classList.contains("panel-collapsed")) {
    btn.innerHTML = "Show";
  } else {
    btn.innerHTML = "X";
  }
};

window.togglePanel = togglePanel;
