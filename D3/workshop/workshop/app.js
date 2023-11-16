d3.queue()
	.defer(d3.csv, './data/all_data.csv', function (row) {
		return {
			continent: row.Continent,
			country: row.Country,
			countryCode: row['Country Code'],
			emissions: +row['Emissions'],
			emissionsPerCapita: +row['Emissions Per Capita'],
			region: row.Region,
			year: +row.Year,
		};
	})
	.await(function (error, data) {
		// Code to execute after data is loaded
		var extremeYears = d3.extent(data, (d) => d.year);
		var country = 'Canada';
		var currentYear = extremeYears[0];
		var currentDataType = d3
			.select('input[name="data-type"]:checked')
			.attr('value');

		var width = 960;
		var height = 300;
		createPie(width, height);
		drawPie(data, currentYear);

		createBar(width, height);
		drawBar(data, currentDataType, country);
        highlightBars(currentYear);

		d3.selectAll('select[name="country"]').on('change', () => {
			country = d3.event.target.value;
			drawBar(data, currentDataType, country);
		});

		d3.select('#year')
			.property('min', currentYear)
			.property('max', extremeYears[1])
			.property('value', currentYear)
			.on('input', () => {
				currentYear = +d3.event.target.value;
				drawPie(data, currentYear);
                highlightBars(currentYear);
			});

		d3.selectAll('input[name="data-type"]').on('change', () => {
			currentDataType = d3.event.target.value;
			drawBar(data, currentDataType, country);
		});

        d3.selectAll('svg').on('mousemove touchmove', updateTooltip);

		function updateTooltip() {
			var tooltip = d3.select('.tooltip');
			var tgt = d3.select(d3.event.target);
			var isCountry = tgt.classed('country');
			var isBar = tgt.classed('bar');
			var isArc = tgt.classed('arc');
			var dataType = d3.select('input:checked').property('value');
			var units =
				dataType === 'emissions'
					? 'thousand metric tones'
					: 'metric tons per capita';
			var data;
			var percentage = '';
			if (isCountry) data = tgt.data()[0].properties;
			if (isArc) {
				data = tgt.data()[0].data;
				percentage = `<p>Percentage of total: ${getPercentage(
					tgt.data()[0],
				)}</p>`;
			}
			if (isBar) data = tgt.data()[0];
			tooltip
				.style('opacity', +(isCountry || isArc || isBar))
				.style(
					'left',
					d3.event.pageX - tooltip.node().offsetWidth / 2 + 'px',
				)
				.style(
					'top',
					d3.event.pageY - tooltip.node().offsetHeight - 10 + 'px',
				);
			if (data) {
				var dataValue = data[dataType]
					? data[dataType].toLocaleString() + ' ' + units
					: 'Data Not Available';
				tooltip.html(`
                    <p>Country: ${data.country}</p>
                    <p>${formatDataType(dataType)}: ${dataValue}</p>
                    <p>Year: ${
						data.year || d3.select('#year').property('value')
					}</p>
                    ${percentage}
                `);
			}
		}
	});
function createPie(width, height) {
	var pie = d3.select('#pie').attr('width', width).attr('height', height);

	pie.append('g')
		.attr(
			'transform',
			'translate(' + width / 2 + ', ' + (height / 2 + 10) + ')',
		)
		.classed('chart', true);

	pie.append('text')
		.attr('x', width / 2)
		.attr('y', '1em')
		.attr('font-size', '1.5em')
		.style('text-anchor', 'middle')
		.classed('pie-title', true);
}

function drawPie(data, currentYear) {
	var pie = d3.select('#pie');

	var arcs = d3
		.pie()
		.sort((a, b) => {
			if (a.continent < b.continent) return -1;
			if (a.continent > b.continent) return 1;
			return a.emissions - b.emissions;
		})
		.value((d) => d.emissions);

	var path = d3
		.arc()
		.outerRadius(+pie.attr('height') / 2 - 50)
		.innerRadius(0);

	var yearData = data.filter((d) => d.year === currentYear);
	var continents = [];
	for (var i = 0; i < yearData.length; i++) {
		var continent = yearData[i].continent;
		if (!continents.includes(continent)) {
			continents.push(continent);
		}
	}

	var colorScale = d3
		.scaleOrdinal()
		.domain(continents)
		.range(['#ab47bc', '#7e57c2', '#26a69a', '#42a5f5', '#78909c']);
	var update = pie.select('.chart').selectAll('.arc').data(arcs(yearData));

	update.exit().remove();

	update
		.enter()
		.append('path')
		.classed('arc', true)
		.attr('stroke', '#dff1ff')
		.attr('stroke-width', '0.25px')
		.merge(update)
		.attr('fill', (d) => colorScale(d.data.continent))
		.attr('d', path);

	pie.select('.pie-title').text(
		'Total emissions by continent and region, ' + currentYear,
	);
}
function createBar(width, height) {
	// Select the #bar element and set its width and height
	var bar = d3.select('#bar').attr('width', width).attr('height', height);

	// Append a group element for the x-axis
	bar.append('g').classed('x-axis', true);

	// Append a group element for the y-axis
	bar.append('g').classed('y-axis', true);

	// Append a text element for the y-axis label
	bar.append('text')
		.attr('transform', 'rotate(-90)') // Rotate the text
		.attr('x', -height / 2) // Position the text
		.attr('dy', '1em')
		.style('text-anchor', 'middle') // Center the text
		.style('font-size', '1em') // Set font size
		.classed('y-axis-label', true); // Add a class for styling

	// Append a text element for the chart title
	bar.append('text')
		.attr('x', width / 2) // Center the text
		.attr('y', '1em')
		.attr('font-size', '1.5em') // Set font size
		.style('text-anchor', 'middle')
		.classed('bar-title', true); // Add a class for styling
}
function drawBar(data, dataType, country) {
	// Select the #bar element
	var bar = d3.select('#bar');

	// Define padding and other chart parameters
	var padding = {
		top: 30,
		right: 30,
		bottom: 30,
		left: 110,
	};
	var barPadding = 1;
	var width = +bar.attr('width');
	var height = +bar.attr('height');

	// Filter data based on the selected country and sort by year
	var countryData = data
		.filter((d) => d.country === country)
		.sort((a, b) => a.year - b.year);

	// Create x and y scales
	var xScale = d3
		.scaleLinear()
		.domain(d3.extent(data, (d) => d.year))
		.range([padding.left, width - padding.right]);

	var yScale = d3
		.scaleLinear()
		.domain([0, d3.max(countryData, (d) => d[dataType])])
		.range([height - padding.bottom, padding.top]);

	// Calculate bar width and create axes
	var barWidth = xScale(xScale.domain()[0] + 1) - xScale.range()[0];
	var xAxis = d3.axisBottom(xScale).tickFormat(d3.format('.0f'));
	var yAxis = d3.axisLeft(yScale);

	// Update and transition the x-axis
	d3.select('.x-axis')
		.attr('transform', 'translate(0,' + (height - padding.bottom) + ')')
		.call(xAxis);

	// Update and transition the y-axis
	d3.select('.y-axis')
		.attr('transform', 'translate(' + (padding.left - barWidth / 2) + ',0)')
		.transition()
		.duration(1000)
		.call(yAxis);

	// Set axis label and chart title
	var axisLabel =
		dataType === 'emissions'
			? 'CO2 Emissions, thousand metric tons'
			: 'CO2 Emissions, metric tons per capita';
	var barTitle = country
		? 'CO2 Emissions, ' + country
		: 'Click on a country to see annual trends.';

	d3.select('.y-axis-label').text(axisLabel);
	d3.select('.bar-title').text(barTitle);

	// Update, exit, and enter bars
	var update = bar.selectAll('.bar').data(countryData);
	var t = d3.transition().duration(1000).ease(d3.easeBounceOut);
	update
		.exit()
		.transition(t)
		.delay((d, i, nodes) => (nodes.length - i - 1) * 100)
		.attr('y', height - padding.bottom)
		.attr('height', 0)
		.remove();

	update
		.enter()
		.append('rect')
		.classed('bar', true)
		.attr('y', height - padding.bottom)
		.attr('height', 0)
		.merge(update)
		.attr('x', (d) => (xScale(d.year) + xScale(d.year - 1)) / 2)
		.attr('width', barWidth - barPadding)
		.transition(t)
		.delay((d, i) => i * 100)
		.attr('y', (d) => yScale(d[dataType]))
		.attr('height', (d) => height - padding.bottom - yScale(d[dataType]));
}

function highlightBars(year) {
	d3.select('#bar')
		.selectAll('rect')
		.attr('fill', (d) => (d.year === year ? '#16a085' : '#1abc9c'));
}

function formatDataType(key) {
	return (
		key[0].toUpperCase() + key.slice(1).replace(/[A-Z]/g, (c) => ' ' + c)
	);
}

function getPercentage(d) {
	var angle = d.endAngle - d.startAngle;
	var fraction = (100 * angle) / (Math.PI * 2);
	return fraction.toFixed(2) + '%';
}
