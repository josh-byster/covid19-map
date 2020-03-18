const d3 = require("d3");
const dayjs = require("dayjs");
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const CONFIRMED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

const DEATH_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv";

const RECOVERED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv";

const TOPOLOGY_LINK =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const LAST_REFRESH =
  "https://api.github.com/repos/CSSEGISandData/COVID-19/commits?path=csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv&page=1&per_page=1";
const getDataForDate = (confirmed, deaths, recovered, date) =>
  confirmed.map((d, idx) => ({
    id: d.id,
    lat: d.Lat,
    long: d.Long,
    country: d["Country/Region"],
    confirmed: d[date],
    // Check for cases where province is the same as country (like France, France) and remove
    province:
      d["Province/State"] == d["Country/Region"] ? "" : d["Province/State"],
    deaths: deaths[idx][date],
    recovered: recovered[idx][date]
  }));

const kFormatter = num =>
  Math.abs(num) > 999
    ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k"
    : num.toFixed(0);

const addIndicesToData = d => d.map((row, idx) => ({ id: idx, ...row }));

const getTotalCases = (data, date) => {
  return data.reduce((acc, row) => acc + +row[date], 0);
};

const processData = (confirmed, deaths, recovered) => {
  const confirmedWithIndices = addIndicesToData(confirmed);
  const deathsWithIndices = addIndicesToData(deaths);
  const recoveredWithIndices = addIndicesToData(recovered);
  const allDates = Object.keys(confirmedWithIndices[0]).slice(5);
  const dateToDataMap = allDates.map(curDate =>
    getDataForDate(
      confirmedWithIndices,
      deathsWithIndices,
      recoveredWithIndices,
      curDate
    )
  );

  const startDate = allDates[0];
  const endDate = allDates[allDates.length - 1];
  return {
    allDates,
    dateToDataMap,
    startDate,
    endDate,
    totalCases: getTotalCases(confirmedWithIndices, endDate),
    confirmedWithIndices
  };
};

const fetchTopology = d3.json(TOPOLOGY_LINK);

const fetchData = Promise.all([
  d3.csv(CONFIRMED_CASES_LINK),
  d3.csv(DEATH_CASES_LINK),
  d3.csv(RECOVERED_CASES_LINK)
]).then(data => processData(...data));

d3.json(LAST_REFRESH).then(data => {
  const lastUpdated = dayjs(data[0]["commit"]["committer"]["date"]).fromNow();
  d3.select("#lastupdated").html(`Last update to dataset: ${lastUpdated}.`);
});

export { fetchData, fetchTopology, getTotalCases, kFormatter };
