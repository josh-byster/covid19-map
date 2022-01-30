const d3 = require("d3");
const dayjs = require("dayjs");
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const CONFIRMED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";

const DEATH_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv";

const RECOVERED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv";

const TOPOLOGY_LINK =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const LAST_REFRESH =
  "https://api.github.com/repos/CSSEGISandData/COVID-19/commits?path=csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv&page=1&per_page=1";

const getDataForDate = (confirmed, deaths, date) =>
  confirmed
    .map((d, idx) => ({
      id: d.id,
      lat: d.Lat,
      long: d.Long,
      country: d["Country/Region"],
      confirmed: d[date],
      // Check for cases where province is the same as country (like France, France) and remove
      province:
        d["Province/State"] == d["Country/Region"] ? "" : d["Province/State"],
      deaths: deaths[idx][date],
      recovered: 0,
    }));

const kFormatter = (num) => {
  if (num > 1e6 - 1) {
    return parseFloat(Math.sign(num) * (Math.abs(num) / 1e6)).toFixed(1) + " million";
  } else if (num > 999) {
    return parseFloat(Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1) + "k";
  } else {
    return num.toFixed(0);
  }
};

const addIndicesToData = (d, startIdx) =>
  d.map((row, idx) => ({ id: startIdx + idx, ...row }));

const getTotalCases = (data, date) => {
  return data.reduce((acc, row) => acc + +row[date], 0);
};

const getAllTotalsForDate = (confirmed, deaths, recovered, date) => {
  const computedObj = {
    confirmed: getTotalCases(confirmed, date),
    deaths: getTotalCases(deaths, date),
    recovered: getTotalCases(recovered, date),
  };
  computedObj.active =
    computedObj.confirmed - computedObj.recovered - computedObj.deaths;
  return computedObj;
};

const processData = (confirmed, deaths, recovered) => {
  [confirmed, deaths, recovered] = [confirmed, deaths, recovered].map((d) =>
    addIndicesToData(d, 0)
  );
  const allDates = Object.keys(confirmed[0]).slice(5);
  const dateToDataMap = allDates.map((curDate) =>
    getDataForDate(confirmed, deaths, curDate)
  );

  const startDate = allDates[0];
  const endDate = allDates[allDates.length - 1];
  const totals = {};

  for (let i = 0; i < allDates.length; i++) {
    totals[allDates[i]] = getAllTotalsForDate(
      confirmed,
      deaths,
      recovered,
      allDates[i]
    );
  }
  return {
    allDates,
    dateToDataMap,
    startDate,
    endDate,
    totals,
    confirmed,
  };
};

const fetchTopology = Promise.all([
  d3.json(TOPOLOGY_LINK)
]);

const fetchData = Promise.all([
  d3.csv(CONFIRMED_CASES_LINK),
  d3.csv(DEATH_CASES_LINK),
  d3.csv(RECOVERED_CASES_LINK)
]).then((data) => {
  const startTime = new Date();
  const processed = processData(...data);
  console.log(`Data processing time: {}ms`, new Date() - startTime);
  return processed;
}
);

d3.json(LAST_REFRESH).then((data) => {
  const lastUpdated = dayjs(data[0]["commit"]["committer"]["date"]).fromNow();
  d3.select("#lastupdated").html(`Last update to dataset: ${lastUpdated}.`);
});

export { fetchData, fetchTopology, getTotalCases, kFormatter };
