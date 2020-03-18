const d3 = require("d3");
const CONFIRMED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

const DEATH_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv";

const RECOVERED_CASES_LINK =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv";

const TOPOLOGY_LINK =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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

const addIndicesToData = d => d.map((row, idx) => ({ id: idx, ...row }));

const getTotalCases = (data, date) => {
  return data.reduce((acc, row) => acc + +row[date],0);

}

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

  const startDate =allDates[0]
  const endDate =  allDates[allDates.length - 1];
  return {
    allDates,
    dateToDataMap,
    startDate,
    endDate,
    totalCases: getTotalCases(confirmedWithIndices,endDate) 
  };
};

const fetchTopology = d3.json(TOPOLOGY_LINK);

const fetchData = Promise.all([
  d3.csv(CONFIRMED_CASES_LINK),
  d3.csv(DEATH_CASES_LINK),
  d3.csv(RECOVERED_CASES_LINK)
]).then(data => processData(...data));

export { fetchData, fetchTopology };
