var data;

var cantons = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH', 'FL'];

var names = {
  "CH": "Ganze Schweiz",
  "AG": "Kanton Aargau",
  "AI": "Kanton Appenzell Innerhoden",
  "AR": "Kanton Appenzell Ausserhoden",
  "BE": "Kanton Bern",
  "BL": "Kanton Basel Land",
  "BS": "Kanton Basel Stadt",
  "FR": "Kanton Freiburg",
  "GE": "Kanton Genf",
  "GL": "Kanton Glarus",
  "GR": "Kanton Graubünden",
  "JU": "Kanton Jura",
  "LU": "Kanton Luzern",
  "NE": "Kanton Neuenburg",
  "NW": "Kanton Nidwalden",
  "OW": "Kanton Obwalden",
  "SG": "Kanton St. Gallen",
  "SH": "Kanton Schaffhausen",
  "SO": "Kanton Solothurn",
  "SZ": "Kanton Schwyz",
  "TG": "Kanton Thurgau",
  "TI": "Kanton Tessin",
  "UR": "Kanton Uri",
  "VD": "Kanton Waadt",
  "VS": "Kanton Wallis",
  "ZG": "Kanton Zug",
  "ZH": "Kanton Zürich",
  "FL": "Fürstentum Liechtenstein"
};

var actualData = [];
var actualDeaths = [];
var actualHospitalisation = [];
var data = [];
Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';
getCanton(0);

function getCanton(i) {
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_'+cantons[i]+'_total.csv'
  if(cantons[i] == "FL") {
    url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_FL_total.csv'
  }
  d3.csv(url, function(error, csvdata) {
      if(error!=null) {
        console.log(error.responseURL+" not found");
        actualData.push({
          date: "Keine Daten",
          ncumul_conf: "",
          abbreviation_canton_and_fl: cantons[i]
        });
        actualDeaths.push({
          date: "Keine Daten",
          ncumul_deceased: "",
          abbreviation_canton_and_fl: cantons[i]
        });
        /*actualHospitalisation.push({
          date: "Keine Daten",
          ncumul_deceased: "",
          abbreviation_canton_and_fl: cantons[i]
        });*/
      }
      else {
        for(var x=0; x<csvdata.length; x++) {
          data.push(csvdata[x]);
        }
        var latestData = csvdata[csvdata.length-1];
        var filteredDataForDeaths = csvdata.filter(function(d) { if(d.ncumul_deceased!="") return d});
        if(filteredDataForDeaths.length==0) {
          actualDeaths.push(latestData);
        }
        else {
          var actualDeath = filteredDataForDeaths[filteredDataForDeaths.length-1];
          actualDeath.ncumul_deceased_previous = filteredDataForDeaths[filteredDataForDeaths.length-2].ncumul_deceased;
          actualDeaths.push(actualDeath);
        }
        var filteredDataForHospitalisation = csvdata.filter(function(d) { if(d.ncumul_hosp!="") return d});
        if(filteredDataForHospitalisation.length==0) {
          //actualHospitalisation.push(latestData);
        }
        else {
          actualHospitalisation.push(filteredDataForHospitalisation[filteredDataForHospitalisation.length-1]);
        }
        if(latestData.ncumul_conf) {
          latestData.ncumul_conf_previous = csvdata[csvdata.length-2].ncumul_conf;
          actualData.push(latestData);
        } else {
          if(csvdata.length>1 && csvdata[csvdata.length-2].ncumul_conf) //Special case for FR
            actualData.push(csvdata[csvdata.length-2]);
          else {
            actualData.push(latestData);
          }
        }
        console.log("added "+csvdata.length+" rows for "+cantons[i]);
      }
      if(i<cantons.length-1) {
        getCanton(i+1);
      }
      else {
        processData();
      }
  });
}

function processData() {
  console.log("Plotting data");
  processActualData();
  processActualDeaths();
  processActualHospitalisation();
  document.getElementById("loadingspinner").style.display = 'none';
  document.getElementById("loaded").style.display = 'block';
  barChartAllCH();
  for(var i=0; i<cantons.length; i++) {
    barChartCases(cantons[i]);
    barChartHospitalisations(cantons[i]);
  }
}

function processActualData() {
  var sortedActual = Array.from(actualData).sort(function(a, b){return b.ncumul_conf-a.ncumul_conf});
  var firstTable = document.getElementById("confirmed_1");
  var secondTable = document.getElementById("confirmed_2");
  var total = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    if(i<sortedActual.length/2) table = firstTable;
    else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_conf;
    var diff = actual.ncumul_conf - actual.ncumul_conf_previous;
    if(actual.abbreviation_canton_and_fl!="FL" && now!="") {
      total+=parseInt(now);
    }
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var a = document.createElement("a");
    a.className = "flag "+actual.abbreviation_canton_and_fl;
    a.href = "#detail_"+actual.abbreviation_canton_and_fl;
    a.appendChild(document.createTextNode(actual.abbreviation_canton_and_fl));
    td.appendChild(a);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(actual.date));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    var span = document.createElement("span");
    span.className = "difference";
    span.appendChild(document.createTextNode(now ? "+"+diff : ''));
    td.appendChild(text);
    td.appendChild(span);
    tr.appendChild(td);
    td = document.createElement("td");
    if(actual.source.substring(0,2)=="ht") {
      a = document.createElement("a");
      a.innerHTML = "↗";
      a.href = actual.source;
      td.appendChild(a);
    }
    else {
      a = document.createElement("a");
      a.innerHTML = "↗";
      a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
      td.appendChild(a);
    }
    tr.appendChild(td);
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  var formattedTotal = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'>CH</a></td><td><b>TOTAL</b></td><td><b>"+formattedTotal+"</b></td><td></td>";
  secondTable.append(tr);
  //document.getElementById("last").append(firstTable);
  //document.getElementById("last").append(secondTable);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total));
}

function processActualDeaths() {
  var sortedActual = Array.from(actualDeaths).sort(function(a, b){return b.ncumul_deceased-a.ncumul_deceased});
  var firstTable = document.getElementById("death_1");
  var secondTable = document.getElementById("death_2");
  var total = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    if(i<sortedActual.length/2) table = firstTable;
    else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_deceased;
    var diff = actual.ncumul_deceased - actual.ncumul_deceased_previous;
    if(actual.abbreviation_canton_and_fl!="FL" && now!="") total+=parseInt(now);

    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var a = document.createElement("a");
    a.className = "flag "+actual.abbreviation_canton_and_fl;
    a.href = "#detail_"+actual.abbreviation_canton_and_fl;
    a.appendChild(document.createTextNode(actual.abbreviation_canton_and_fl));
    td.appendChild(a);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(actual.date));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    var span = document.createElement("span");
    span.className = "difference";
    span.appendChild(document.createTextNode(now ? "+"+diff : ''));
    td.appendChild(text);
    td.appendChild(span);
    tr.appendChild(td);
    td = document.createElement("td");
    if(actual.source.substring(0,2)=="ht") {
      a = document.createElement("a");
      a.innerHTML = "↗";
      a.href = actual.source;
      td.appendChild(a);
    }
    else {
      a = document.createElement("a");
      a.innerHTML = "↗";
      a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
      td.appendChild(a);
    }
    tr.appendChild(td);
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.innerHTML = "<td><span class='flag CH'>CH</span></td><td><b>TOTAL</b></td><td><b>"+total+"</b></td><td></td>";
  secondTable.append(tr);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total));
}

function processActualHospitalisation() {
  var sortedActual = Array.from(actualHospitalisation).sort(function(a, b){return b.ncumul_hosp-a.ncumul_hosp});
  var secondTable = document.getElementById("hospitalised_2");
  var total = 0;
  var totalicu = 0;
  var totalvent = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    //if(i<sortedActual.length/2)
    table = secondTable;
    //else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_hosp;
    if(actualHospitalisation.abbreviation_canton_and_fl!="FL" && now!="") total+=parseInt(now);
    if(actualHospitalisation.abbreviation_canton_and_fl!="FL" && actual.ncumul_ICU!="") totalicu+=parseInt(actual.ncumul_ICU);
    if(actualHospitalisation.abbreviation_canton_and_fl!="FL" && actual.ncumul_vent!="") totalvent+=parseInt(actual.ncumul_vent);

    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var a = document.createElement("a");
    a.className = "flag "+actual.abbreviation_canton_and_fl;
    a.href = "#detail_"+actual.abbreviation_canton_and_fl;
    a.appendChild(document.createTextNode(actual.abbreviation_canton_and_fl));
    td.appendChild(a);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(actual.date));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(actual.ncumul_ICU);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(actual.ncumul_vent);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    if(actual.source.substring(0,2)=="ht") {
      a = document.createElement("a");
      a.innerHTML = "↗";
      a.href = actual.source;
      td.appendChild(a);
    }
    else {
      a = document.createElement("a");
      a.innerHTML = "↗";
      a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
      td.appendChild(a);
    }
    tr.appendChild(td);
    secondTable.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.innerHTML = "<td><span class='flag CH'><b>CH</b></span></td><td><b>TOTAL</b></td><td><b>"+total+"</b></td><td><b>"+totalicu+"</b></td><td><b>"+totalvent+"</b></td><td></td>";
  secondTable.append(tr);

  //document.getElementById("last").append(secondTable);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total+ " / "+totalicu+" / "+totalvent));

}

/*
d3.json('https://api.github.com/repos/openZH/covid_19/commits?path=COVID19_Cases_Cantons_CH_total.csv&page=1&per_page=1', function(error, data) {
  var lastUpdateDiv = document.getElementById('latestUpdate');
  lastUpdateDiv.innerHTML = "<i>Letztes Update der offiziellen Daten: "+data[0].commit.committer.date.substring(0,10)+" ("+data[0].commit.message+")</i>";
});
*/

/*
d3.csv('https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_cases_switzerland.csv', function(error, csvdata) {
  var div = document.getElementById("inofficial");
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  canvas.id = 'chinofficial';
  canvas.height=300;
  canvas.width=300+csvdata.length*30;
  div.appendChild(canvas);
  var dateLabels = csvdata.map(function(d) {return d.Date});
  var testedPos = csvdata.map(function(d) {return d.CH});
  var chart = new Chart('chinofficial', {
    type: 'bar',
    options: {
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Unbestätigte Fälle Schweiz'
      },
      tooltips: {
						mode: "index",
						intersect: true,
			},
      scales: {
        xAxes: [{
                  stacked: true,
                  id: "bar-x-axis1"
                }],
      yAxes: [{
        stacked: false,
        ticks: {
          beginAtZero: true,
          suggestedMax: 10,
        },
      }]
  },
      plugins: {
        labels: {
          render: function (args) {
               var index = args.index;
               var value = args.value;
               if(index==0) return "";
               var lastValue = args.dataset.data[index-1];
               var percentageChange = value/lastValue - 1;
               var rounded = Math.round(percentageChange * 100);
               var label = ""+rounded;
               if(rounded >= 0) label = "+"+label+"%";
               else label = "-"+label+"%";
               return label;
            }
          }
        }
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: testedPos,
          backgroundColor: '#F15F36',
          borderWidth: 1,
          label: "Positiv getestet"
        }
      ]
    }
  });
});
*/

Chart.Tooltip.positioners.custom = function(elements, eventPosition) { //<-- custom is now the new option for the tooltip position
    /** @type {Chart.Tooltip} */
    var tooltip = this;

    /* ... */

    var half = eventPosition.x - 81 - 10;
    if(half< 81 + 60) half = 81 + 60;
    return {
        x: half,
        y: 30
    };
}

function barChartAllCH() {
  date = new Date(Date.UTC(2020, 1, 25));
  var now = new Date();
  //alert(now.toISOString());
  var dataPerDay = [];
  while(date<now) {
    var dateString = date.toISOString();
    dateString = dateString.substring(0,10);
    console.log(dateString);
    var singleDayObject = {};
    singleDayObject.date = dateString;
    singleDayObject.data = [];
    for(var i=0; i<cantons.length-1; i++) { //without FL
      var canton = cantons[i];
      var cantonTotal = getNumConf(canton, date);
      singleDayObject.data.push(cantonTotal);
    }
    var total = singleDayObject.data.reduce(function(acc, val) { return acc + val.ncumul_conf; }, 0);
    singleDayObject.total = total;
    dataPerDay.push(singleDayObject);
    date = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()+1));
  }
  //console.log(dataPerDay);
  var place = "CH";
  var section = document.getElementById("detail");
  var article = document.createElement("article");
  article.id="detail_"+place;
  var h3 = document.createElement("h3");
  h3.className = "flag "+place;
  var text = document.createTextNode(names[place]);
  h3.appendChild(text);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
  var canvas = document.createElement("canvas");
  canvas.id = place;
  canvas.height=500;
  div.appendChild(canvas);
  article.appendChild(div);
  section.appendChild(article);
  var dateLabels = dataPerDay.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var cases = dataPerDay.map(function(d) {return d.total});
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Bestätigte Fälle'
      },
      tooltips: {
        mode: 'nearest',
        intersect: false,
        position : 'custom',
        caretSize: 0,
        bodyFontFamily: 'monospace',
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var tabbing = 6-value.length;
            var padding = " ".repeat(tabbing);
            return padding+value;
          },
          afterBody: function(tooltipItems, data) {
            //console.log(tooltipItems);
            //console.log(data);
            multistringText = [""];
            var index = tooltipItems[0].index;
            var dataForThisDay = dataPerDay[index];
            var sorted = Array.from(dataForThisDay.data).sort(function(a, b){return b.ncumul_conf-a.ncumul_conf});
            sorted.forEach(function(item) {
              var tabbing = 5-(""+item.ncumul_conf).length;
              var padding = " ".repeat(tabbing);
              multistringText.push(item.canton+":"+padding+item.ncumul_conf+" ("+item.date+")");
            });

            return multistringText;
          }
        }
      },
      scales: {
            xAxes: [{
                type: 'time',
                time: {
                    tooltipFormat: 'D.MM.YYYY',
                    unit: 'day',
                    min: new Date("2020-02-24T23:00:00"),
                    max: new Date(),
                    displayFormats: {
                        day: 'D.MM'
                    }
                }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
                suggestedMax: 10,
              },
            }]
        },
      plugins: {
          datalabels: {
  						color: 'black',
  						font: {
  							weight: 'bold'
  						},
  						formatter: function(value, context) {
                var index = context.dataIndex;
                if(index==0) return "";
                var lastValue = context.dataset.data[index-1];
                var percentageChange = value/lastValue - 1;
                var rounded = Math.round(percentageChange * 100);
                var label = ""+rounded;
                if(rounded >= 0) label = "+"+label+"%";
                else label = "-"+label+"%";

                var change = value-lastValue;
                var label = change>0 ? "+"+change : change;
                return label;
              }
  					}
          }
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: cases,
          fill: false,
          cubicInterpolationMode: 'monotone',
          spanGaps: true,
          borderColor: '#F15F36',
          backgroundColor: '#F15F36',
          datalabels: {
						align: 'end',
						anchor: 'end'
					}
        }
      ]
    }
  });
}

function getNumConf(canton, date) {
  var dateString = date.toISOString();
  dateString = dateString.substring(0,10);
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==canton && d.date==dateString && d.ncumul_conf!="") return d});
  if(filteredData.length>0) {
    if(filteredData.length>1) console.log("More then 1 line for "+canton+" date: "+dateString);
    return {
      canton: canton,
      date: dateString,
      ncumul_conf: parseInt(filteredData[filteredData.length-1].ncumul_conf)
    }
  }
  for(var i=1; i<=10; i++) {
    date = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()-1));
    dateString = date.toISOString().substring(0,10);
    filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==canton && d.date==dateString && d.ncumul_conf!="") return d});
    if(filteredData.length>0) {
      if(filteredData.length>1) console.log("More then 1 line for "+canton+" date: "+dateString);
      return {
        canton: canton,
        date: dateString,
        ncumul_conf: parseInt(filteredData[filteredData.length-1].ncumul_conf)
      }
    }
  }
  return {
    canton: canton,
    date: "Keine Daten",
    ncumul_conf: 0
  }
}

function barChartCases(place) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  var section = document.getElementById("detail");
  var article = document.createElement("article");
  article.id="detail_"+place;
  var h3 = document.createElement("h3");
  h3.className = "flag "+place;
  var text = document.createTextNode(names[place]);
  h3.appendChild(text);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  if(filteredData.length==0) {
    div.appendChild(document.createTextNode("Keine Daten"));
  }
  else if(filteredData.length==1) {
    div.appendChild(document.createTextNode("Ein Datensatz: "+filteredData[0].ncumul_conf+" Fälle am "+filteredData[0].date));
  }
  else {
    canvas.id = place;
    canvas.height=300;
    //canvas.width=350+filteredData.length*40;
    div.appendChild(canvas);
  }
  article.appendChild(div);
  section.appendChild(article);
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_conf!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var cases = moreFilteredData.map(function(d) {return d.ncumul_conf});
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Bestätigte Fälle'
      },
      scales: {
            xAxes: [{
                type: 'time',
                time: {
                    tooltipFormat: 'D.MM.YYYY',
                    unit: 'day',
                    min: new Date("2020-02-24T23:00:00"),
                    max: new Date(),
                    displayFormats: {
                        day: 'D.MM'
                    }
                }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
                suggestedMax: 10,
              },
            }]
        },
      plugins: {
          datalabels: {
  						color: 'black',
  						font: {
  							weight: 'bold'
  						},
  						formatter: function(value, context) {
                var index = context.dataIndex;
                if(index==0) return "";
                var lastValue = context.dataset.data[index-1];
                var percentageChange = value/lastValue - 1;
                var rounded = Math.round(percentageChange * 100);
                var label = ""+rounded;
                if(rounded >= 0) label = "+"+label+"%";
                else label = "-"+label+"%";

                var change = value-lastValue;
                var label = change>0 ? "+"+change : change;
                return label;
              }
  					}
          }
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: cases,
          fill: false,
          cubicInterpolationMode: 'monotone',
          spanGaps: true,
          borderColor: '#F15F36',
          backgroundColor: '#F15F36',
          datalabels: {
						align: 'end',
						anchor: 'end'
					}
        }
      ]
    }
  });
}

function barChartHospitalisations(place) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  var hospitalFiltered = filteredData.filter(function(d) { if(d.ncumul_hosp!="") return d});
  if(hospitalFiltered.length==0) return;
  var div = document.getElementById("container_"+place);
  div.className = "canvas-dummy";
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  if(filteredData.length==1) {
    var text = filteredData[0].date+": "+filteredData[0].ncumul_hosp+" hospitalisiert";
    if(filteredData[0].ncumul_ICU!="") text+=" , "+filteredData[0].ncumul_ICU+" in Intensivbehandlung";
    if(filteredData[0].ncumul_vent!="") text+=" , "+filteredData[0].ncumul_vent+" künstlich beatmet";
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode(text));
  }
  else {
    canvas.id = "hosp"+place;
    canvas.height=300;
    div.appendChild(canvas);
    //canvas.width=350+filteredData.length*40;
  }
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_conf!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var datasets = [];
  var casesHosp = moreFilteredData.map(function(d) {if(d.ncumul_hosp=="") return null; return d.ncumul_hosp});
  datasets.push({
    label: 'Hospitalisiert',
    data: casesHosp,
    fill: false,
    cubicInterpolationMode: 'monotone',
    spanGaps: true,
    borderColor: '#CCCC00',
    backgroundColor: '#CCCC00',
    datalabels: {
      align: 'end',
      anchor: 'end'
    }
  });
  var filteredForICU = moreFilteredData.filter(function(d) { if(d.ncumul_ICU!="") return d});
  if(filteredForICU.length>0) {
    var casesICU = moreFilteredData.map(function(d) {if(d.ncumul_ICU=="") return null; return d.ncumul_ICU});
    datasets.push({
      label: 'In Intensivbehandlung',
      data: casesICU,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#CF5F5F',
      backgroundColor: '#CF5F5F',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var filteredForVent = moreFilteredData.filter(function(d) { if(d.ncumul_vent!="") return d});
  if(filteredForVent.length>0) {
    var casesVent = moreFilteredData.map(function(d) {if(d.ncumul_vent=="") return null; return d.ncumul_vent});
    datasets.push({
      label: 'Künstlich beatmet',
      data: casesVent,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#115F5F',
      backgroundColor: '#115F5F',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Hospitalisierte Fälle'
      },
      tooltips: {
            mode: 'index',
            axis: 'y'
      },
      scales: {
            xAxes: [{
                type: 'time',
                time: {
                    tooltipFormat: 'D.MM.YYYY',
                    unit: 'day',
                    min: new Date("2020-02-24T23:00:00"),
                    max: new Date(),
                    displayFormats: {
                        day: 'D.MM'
                    }
                }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
                suggestedMax: 10,
              },
            }]
        },
      plugins: {
          datalabels: false
      }
    },
    data: {
      labels: dateLabels,
      datasets: datasets
    }
  });
}
