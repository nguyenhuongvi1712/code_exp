// Sample data with unique IDs
const data = [
	{ id: 1, value: 20 },
	{ id: 2, value: 30 },
	{ id: 3, value: 40 },
	{ id: 4, value: 50 },
];

// Function to identify data elements uniquely
const keyFunction = (d) => d.id;

// Initial chart rendering
const bars = svg
	.selectAll('rect')
	.data(data, keyFunction)
	.enter()
	.append('rect')
	.attr('x', (d, i) => i * (width / data.length))
	.attr('y', (d) => height - margin.bottom - d.value)
	.attr('width', width / data.length - 2)
	.attr('height', (d) => d.value);

// Simulate data changes
setTimeout(() => {
	const newData = [
		{ id: 2, value: 35 },
		{ id: 1, value: 25 },
		{ id: 4, value: 45 },
		{ id: 5, value: 55 },
	];

	// Update the chart with new data while keeping the unique IDs
	const updatedBars = svg.selectAll('rect').data(newData, keyFunction);

	updatedBars.exit().remove();

	updatedBars
		.enter()
		.append('rect')
		.attr('x', (d, i) => i * (width / newData.length))
		.attr('y', (d) => height - margin.bottom - d.value)
		.attr('width', width / newData.length - 2)
		.attr('height', (d) => d.value)
		.merge(updatedBars)
		.transition()
		.duration(1000)
		.attr('x', (d, i) => i * (width / newData.length))
		.attr('y', (d) => height - margin.bottom - d.value)
		.attr('width', width / newData.length - 2)
		.attr('height', (d) => d.value);
}, 2000);
