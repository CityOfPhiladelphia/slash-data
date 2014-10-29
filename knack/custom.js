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
})

function drawCharts (chartData) {
  var records = chartData.records

  // Exclude non-city data sets
  records = records.filter(function (record) {
    return record.field_69 == 'No'
  })

  // Released count and department totals in a bootstrap row
  var datasetsAndDepartments = $('#view_41')
  datasetsAndDepartments.append('<div class="row">' +
                                  '<div class="col-xs-12 col-md-6">' +
                                    '<h2><span id="release-count"></span> Datasets</h2>' +
                                    '<div class="panel panel-default">' +
                                      '<div class="panel-body">' +
                                        '<div id="released-count-chart"></div>' +
                                      '</div>' +
                                    '</div>' +
                                  '</div>' +
                                  '<div class="col-xs-12 col-md-6">' +
                                    '<h2><span id="dept-count"></span> Departments</h2>' +
                                    '<div class="panel panel-default">' +
                                      '<div class="panel-body">' +
                                        '<div id="department-totals-chart"></div>' +
                                      '</div>' +
                                    '</div>' +
                                  '</div>' +
                                '</div>')

  // Set release-count header
  $('#release-count').text(records.length)


  // Released count column chart

  // Exclude pre-2012-Q2 for this chart
  post2012q2 = records.filter(function (rec) {
    return rec.field_190 >= '2012-Q2'
  })

  var counts = {}
  post2012q2.forEach(function (rec) {
    var q = rec.field_190

    // Increment or create count
    counts[q] ? counts[q]++ : counts[q] = 1
  })

  // Array with quarters sorted
  var releasedArray = [
    ['Quarter', 'Datasets']
  ].concat(Object.keys(counts).sort().map(function (quarter) {
    return [quarter, counts[quarter]]
  }))

  var data = google.visualization.arrayToDataTable(releasedArray);
  var options = {
    title: 'Released Datasets by Quarter',
    legend: {position: 'none'},
    chartArea: {top: 40, height: '60%', width: '80%'},
    height: 300,
    hAxis: {
      slantedText: true,
      title: 'Excludes 44 datasets released prior to the Executive Order in 2012-Q2'
    },
    vAxis: {minValue: 0, ticks: [0,5,10,15,20,25,30]},
    backgroundColor: 'transparent'
  };
  var chart = new google.visualization.ColumnChart(document.getElementById('released-count-chart'));
  chart.draw(data, options);


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
  })

  // Set dept-count header
  $('#dept-count').text(rows.length)

  var data = new google.visualization.DataTable({
    cols: [
      {label: 'Department', type: 'string'},
      {label: 'Datasets', type: 'number'}
    ],
    rows: rows
  })

  var options = {
    title: 'Department Totals',
    chartArea: {top: 40, height: '75%', width: '80%'},
    pieHole: 0.4,
    sliceVisibilityThreshold: .02,
    height: 300,
    backgroundColor: 'transparent'
  }

  var chart = new google.visualization.PieChart(document.getElementById('department-totals-chart'))
  chart.draw(data, options)


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

  var scatterChart = $('#view_23')
  scatterChart.append('<div class="row">' +
                        '<div class="col-md-12">' +
                          '<div class="panel panel-default">' +
                            '<div class="panel-body">' +
                              '<div id="scatter-chart"></div>' +
                            '</div>' +
                          '</div>' +
                        '</div>' +
                      '</div>')

  var chart = new google.visualization.ScatterChart(document.getElementById('scatter-chart'));
  chart.draw(data, options)
}
