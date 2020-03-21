import { kFormatter } from "./data";
const d3 = require("d3");
class Panel {
  // Manage the total case counts
  constructor(totals, allDates) {
    this.totals = totals;
    this.allDates = allDates;
    const lastDate = allDates[allDates.length - 1];
    const currentDayTotals = totals[lastDate];
    [
      { div: "#panel-confirmed", count: currentDayTotals.confirmed },
      { div: "#panel-recovered", count: currentDayTotals.recovered },
      { div: "#panel-deaths", count: currentDayTotals.deaths },
      { div: "#panel-active", count: currentDayTotals.active }
    ].forEach(obj => {
      d3.select(obj.div)
        .transition()
        .duration(4000)
        .delay(500)
        .tween("text", function() {
          const i = d3.interpolate(0, obj.count);
          return function(t) {
            d3.select(this).text(`~${kFormatter(i(t))}`);
          };
        });
    });
    d3.select("#panel-date").html(lastDate);
  }

  renderTotalCases = (animated, prevDate, curDate) => {
    [
      {
        div: "#panel-confirmed",
        prevCount: this.totals[prevDate].confirmed,
        newCount: this.totals[curDate].confirmed
      },
      {
        div: "#panel-recovered",
        prevCount: this.totals[prevDate].recovered,
        newCount: this.totals[curDate].recovered
      },
      {
        div: "#panel-deaths",
        prevCount: this.totals[prevDate].deaths,
        newCount: this.totals[curDate].deaths
      },
      {
        div: "#panel-active",
        prevCount: this.totals[prevDate].active,
        newCount: this.totals[curDate].active
      }
    ].forEach(obj => {
      d3.select(obj.div)
        .transition()
        .duration(animated ? 500 : 0)
        .delay(0)
        .tween("text", function() {
          const i = d3.interpolate(obj.prevCount, obj.newCount);
          return function(t) {
            d3.select(this).text(`~${kFormatter(i(t))}`);
          };
        });
    });
    d3.select("#panel-date").html(curDate);
  };
}

export default Panel;
