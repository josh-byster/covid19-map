// Test import of a JavaScript function, an SVG, and Sass
import Map from './js/map'
import Slider from './js/slider'
import WebpackLogo from './images/webpack-logo.svg'
import './styles/main.css'
import './styles/slider.css'

const t = new Map();
const s = new Slider();
console.log(t)
// // Create SVG logo node
// const logo = document.createElement('img')
// logo.src = WebpackLogo

// // Create heading node
// const greeting = document.createElement('h1')
// greeting.textContent = HelloWorld()

// // Append SVG and heading nodes to the DOM
// const app = document.querySelector('#root')
// app.append(logo, greeting)
