// Don't do anything until page is rendered
$(document).on('knack-scene-render.scene_1', function (event, page) {
  // Get chart data
  $.ajax({
    dataType: 'json',
    headers: {
      'X-Knack-Application-Id': '541b04e99a3db5a01b00b13b',
      'X-Knack-REST-API-Key': 'knack'
    },
    // Chart data is in table at view_28 (hidden by CSS)
    url: 'https://api.knackhq.com/v1/scenes/scene_1/views/view_28/records?rows_per_page=9999',
    success: drawCharts
  });
  
  // Clearfix where necessary
  //$('.view_5, .view_18, .view_19, .view_20').addClass('btcf')
})

function drawCharts (chartData) {
  var records = chartData.records
  
  // Exclude non-city data sets
  records = records.filter(function (record) {
    return record.field_69 == 'No'
  })
  //console.log('chart records:', records);


  // Released count column chart

  var counts = records.reduce(function (c, rec) {
    var quarter = rec.field_190

    // Only include records after 2012-Q2
    if (quarter >= '2012-Q2') 
      // Increment or create count
      c[quarter] ? c[quarter]++ : c[quarter] = 1

    return c
  }, {})
  //console.log('counts:', counts)

  // Array with quarters sorted
  var releasedArray = [
    ['Quarter', 'Datasets']
  ].concat(Object.keys(counts).sort().map(function (quarter) {
    return [quarter, counts[quarter]]
  }))
  //console.log('relArr:', releasedArray)
  
  var data = google.visualization.arrayToDataTable(releasedArray);
  var options = {
    title: 'Released Datasets by Quarter',
    legend: {position: 'none'},
    hAxis: {slantedText: true},
    vAxis: {minValue: 0, ticks: [0,5,10,15,20,25,30]},
    backgroundColor: 'transparent'
  };
  var chart = new google.visualization.ColumnChart(document.getElementById('view_22'));
  chart.draw(data, options);


  // Demand vs. Complexity scatterplot

  var rows = records.filter(function (rec) {
    // Only include records with both cost and demand defined
    return rec.field_169 && rec.field_49
  }).map(function (rec) {
    var cost = rec.field_169
    var demand = rec.field_49
    var published = rec.field_131 == 'Y' || null
    var notPublished = !published || null
    var name = rec.field_119
    
    // Cost and demand are fuzzied for better scatter
    var fuzzyCost = cost - 0.5 + Math.random()
    var fuzzyDemand = demand - 0.5 + Math.random()
    return {c: [
      {v: fuzzyCost},
      {v: published && fuzzyDemand},
      {v: name},
      {v: notPublished && fuzzyDemand},
      {v: name}  // Need to repeat name for each series
    ]}
  })
  //console.log('cost demand rows:', rows)

  var data = new google.visualization.DataTable({
    cols: [
      {label: 'Cost', type: 'number'},
      {label: 'Published', type: 'number'},
      {p: {role: 'tooltip'}, type: 'string'},
      {label: 'Not Published', type: 'number'},
      {p: {role: 'tooltip'}, type: 'string'}
    ],
    rows: rows
  })
  var options = {
    title: 'Cost vs. Demand of Published & Unpublished Data Sets',
    legend: {position: 'bottom'},
    chartArea: {top: 40, height: '75%', width: '80%'},
    height: 600,
    backgroundColor: 'transparent',
    hAxis: {
      title: 'Cost/Complexity',
      baseline: 3,
      minValue: 0,
      textPosition: 'in',
      textStyle: {color: '#aaa'},
      ticks: [
        {v: 1, f: ''},
        {v: 2, f: 'Low'},
        {v: 4, f: ''},
        {v: 5, f: 'High'}
      ],
      viewWindow: {max: 6},
    },
    vAxis: {
      title: 'Demand/Impact',
      baseline: 3,
      minValue: 0,
      textPosition: 'in',
      textStyle: {color: '#aaa'},
      ticks: [
        {v: 1, f: ''},
        {v: 2, f: 'Low'},
        {v: 4, f: ''},
        {v: 5, f: 'High'}
      ],
      viewWindow: {max: 6},
    }
  };
  var chart = new google.visualization.ScatterChart(document.getElementById('view_23'));
  chart.draw(data, options)
  
  
  // Department totals chart
  
  var byDept = records.reduce(function (depts, rec) {
    var dept = rec.field_120
    depts[dept] ? depts[dept]++ : depts[dept] = 1
    return depts
  }, {})
  
  var rows = Object.keys(byDept).map(function (dept) {
    return {c: [
      {v: dept.replace(/<[^>]*>/g, '')},
      {v: byDept[dept]}
    ]}
  })//.sort(function (a, b) {
  //  return b[1] - a[1]
  //})
  
  var data = new google.visualization.DataTable({
    cols: [
      {label: 'Department', type: 'string'},
      {label: 'Datasets', type: 'number'}
    ],
    rows: rows
  })
  
  var options = {
    title: 'Department Totals',
    pieHole: 0.4,
    sliceVisibilityThreshold: .05,
    height: 220,
    chartArea: {top: 40, left: 0, height: '90%', width: '90%'},
    backgroundColor: 'transparent'
  }
  
  var chart = new google.visualization.PieChart(document.getElementById('view_24'))
  chart.draw(data, options)
}
