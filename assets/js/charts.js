window.ElectionCharts = (() => {
  let seatsChart, votesChart, turnoutChart;
  const palette = ["#07563f","#d7aa35","#365d8d","#9b4d5f","#6e7881","#8a67a8","#d97b3f"];

  function groupByParty(results) {
    const map = {};
    results.forEach(r => {
      if (r.status === "pending") return;
      const p = r.party || "Other";
      if (!map[p]) map[p] = {seats:0, votes:0};
      if (r.status === "declared") map[p].seats += 1;
      map[p].votes += Number(r.votes || 0);
    });
    return map;
  }

  function commonOptions() {
    return {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:"bottom",labels:{usePointStyle:true,padding:18}}},
      animation:{duration:600}
    };
  }

  function render(results) {
    if (!window.Chart) return;
    const grouped = groupByParty(results);
    const labels = Object.keys(grouped);
    const seats = labels.map(p => grouped[p].seats);
    const votes = labels.map(p => grouped[p].votes);

    seatsChart?.destroy();
    seatsChart = new Chart(document.getElementById("seatsChart"), {
      type:"bar",
      data:{labels,datasets:[{label:"نشستیں",data:seats,backgroundColor:palette,borderRadius:8}]},
      options:{...commonOptions(),scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}}
    });

    votesChart?.destroy();
    votesChart = new Chart(document.getElementById("votesChart"), {
      type:"doughnut",
      data:{labels,datasets:[{data:votes,backgroundColor:palette,borderWidth:0}]},
      options:{...commonOptions(),cutout:"62%"}
    });

    const declared = results.filter(r => r.status !== "pending" && Number(r.turnout) > 0);
    turnoutChart?.destroy();
    turnoutChart = new Chart(document.getElementById("turnoutChart"), {
      type:"line",
      data:{
        labels:declared.map(r => r.constituency),
        datasets:[{label:"ٹرن آؤٹ %",data:declared.map(r => Number(r.turnout)),borderColor:"#07563f",backgroundColor:"rgba(7,86,63,.12)",fill:true,tension:.32,pointRadius:4}]
      },
      options:{...commonOptions(),scales:{y:{beginAtZero:true,max:100},x:{grid:{display:false}}}}
    });
  }
  return {render};
})();