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

const US_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv";
const US_DEATHS_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv";

const LAST_REFRESH =
  "https://api.github.com/repos/CSSEGISandData/COVID-19/commits?path=csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv&page=1&per_page=1";

const getDataForDate = (confirmed, deaths, date) =>
  confirmed.filter(d => d["Country/Region"] !== "US").map((d, idx) => ({
    id: d.id,
    lat: d.Lat,
    long: d.Long,
    country: d["Country/Region"],
    confirmed: d[date],
    // Check for cases where province is the same as country (like France, France) and remove
    province:
      d["Province/State"] == d["Country/Region"] ? "" : d["Province/State"],
    deaths: deaths[idx][date],
    recovered: 0
  }));

const getUSDataForDate = (confirmed, deaths, date) => {
  return confirmed.map((d, idx) => ({
    id: d.id,
    lat: d.Lat,
    long: d.Long_,
    country: d["Province_State"],
    confirmed: d[date],
    // Check for cases where province is the same as country (like France, France) and remove
    province:
      d["Admin2"],
    deaths: deaths[idx][date],
    recovered: 0
  })).filter(d => d.confirmed > 10);
};
const kFormatter = num =>
  Math.abs(num) > 999
    ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k"
    : num.toFixed(0);

const addIndicesToData = (d, startIdx) =>
  d.map((row, idx) => ({ id: startIdx + idx, ...row }));

const getTotalCases = (data, date) => {
  return data.reduce((acc, row) => acc + +row[date], 0);
};

const getAllTotalsForDate = (confirmed, deaths, recovered, date) => {
  const computedObj = {
    confirmed: getTotalCases(confirmed, date),
    deaths: getTotalCases(deaths, date),
    recovered: getTotalCases(recovered, date)
  };
  computedObj.active =
    computedObj.confirmed - computedObj.recovered - computedObj.deaths;
  return computedObj;
};

const processData = (confirmed, deaths, recovered, us_conf, us_deaths) => {
  [confirmed, deaths, recovered] = [confirmed, deaths, recovered].map(d =>
    addIndicesToData(d, 0)
  );
  // Start indices at a different number to distinguish
  [us_conf, us_deaths] = [us_conf, us_deaths].map(d =>
    addIndicesToData(d, 100000)
  );
  const allDates = Object.keys(confirmed[0]).slice(5);
  const dateToDataMap = allDates.map(curDate =>
    getDataForDate(confirmed, deaths, curDate).concat(getUSDataForDate(us_conf,us_deaths,curDate))
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
    confirmed
  };
};

const fetchTopology = d3.json(TOPOLOGY_LINK);

const fetchData = Promise.all([
  d3.csv(CONFIRMED_CASES_LINK),
  d3.csv(DEATH_CASES_LINK),
  d3.csv(RECOVERED_CASES_LINK),
  d3.csv(US_CASES_LINK),
  d3.csv(US_DEATHS_LINK)
]).then(data => processData(...data));

d3.json(LAST_REFRESH).then(data => {
  const lastUpdated = dayjs(data[0]["commit"]["committer"]["date"]).fromNow();
  d3.select("#lastupdated").html(`Last update to dataset: ${lastUpdated}.`);
});

export { fetchData, fetchTopology, getTotalCases, kFormatter };
