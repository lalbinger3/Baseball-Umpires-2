// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const width = 800, height = 600;
    const margin = { top: 25, right: 25, bottom: 50, left: 50 };

    // Create the SVG container
    const svg = d3.select("#boxplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    // You can use the range 0 to 1000 for the number of Likes, or if you want, you can use
    // d3.min(data, d => d.Likes) to achieve the min value and 
    // d3.max(data, d => d.Likes) to achieve the max value
    // For the domain of the xscale, you can list all four platforms or use
    // [...new Set(data.map(d => d.Platform))] to achieve a unique list of the platform
    const xScale = d3.scaleBand()
        .domain([...new Set(data.map(d => d.Platform))])
        .range([0, width])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .range([height, 0]);

    // Add scales     
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .text("Platform")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle");

    // Add y-axis label
    svg.append("text")
        .text("Number of Likes")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle");

    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        return { min, q1, median, q3, max };
    };

    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

    quantilesByGroups.forEach((quantiles, Platform) => {
        const x = xScale(Platform);
        const boxWidth = xScale.bandwidth();

        // Draw vertical lines
        svg.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(quantiles.min))
            .attr("y2", yScale(quantiles.max))
            .attr("stroke", "red");

        // Draw box
        svg.append("rect")
            .attr("x", x)
            .attr("y", yScale(quantiles.q3))
            .attr("width", boxWidth)
            .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
            .attr("fill", "#fdae61")
            .attr("stroke", "red");

        // Draw median line
        svg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScale(quantiles.median))
            .attr("y2", yScale(quantiles.median))
            .attr("stroke", "red");
    });
});

// Prepare your data and load the data again.
// This data should contains three columns, platform, post type and average number of likes.  
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    const width = 800, height = 600;
    const margin = { top: 25, right: 25, bottom: 50, left: 50 };

    // Create the SVG container
    const svg = d3.select("#barplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type
    const x0 = d3.scaleBand()
        .domain([...new Set(data.map(d => d.Platform))])
        .range([0, width])
        .padding(0.1);

    const x1 = d3.scaleBand()
        .domain([...new Set(data.map(d => d.PostType))])
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain([...new Set(data.map(d => d.PostType))])
        .range(["#4c72b0", "#55a868", "#c44e52"]);

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .text("Platform")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle");

    // Add y-axis label
    svg.append("text")
        .text("Average Likes")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle");

    // Group the data by platform
    const barGroups = d3.group(data, d => d.Platform);

    // Draw the bars
    svg.selectAll("g.bar-group")
        .data([...barGroups])
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d[0])},0)`)
        .selectAll("rect")
        .data(d => d[1])
        .enter()
        .append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill", d => color(d.PostType));

    // Add the legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, ${margin.top + 20})`);  // Adjusted position

    const types = [...new Set(data.map(d => d.PostType))];

    types.forEach((type, i) => {
    legend.append("rect")
        .attr("x", -350)
        .attr("y", i * 25) 
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(type));

    // Alread have the text information for the legend. 
    // Now add a small square/rect bar next to the text with different color.
    legend.append("text")
        .attr("x", -325) 
        .attr("y", i * 25 + 12)
        .text(type)
        .attr("alignment-baseline", "middle");
    });

});


// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 
const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.AvgLikes = +d.AvgLikes;
    });
    
    // Define the dimensions and margins for the SVG
    const width = 800, height = 600;
    const margin = { top: 25, right: 25, bottom: 50, left: 50 };
    
    // Create the SVG container
    const svg = d3.select("#lineplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
   
    // Set up scales for x and y axes
    const xScale = d3.scalePoint()
        .domain(data.map(d => d.Date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .range([height, 0]);

    // Draw the axis, you can rotate the text in the x-axis here
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-25)");

    svg.append("g").call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("Date");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Average Likes");
        
    // Draw the line and path. Remember to use curveNatural.
    const line = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d.AvgLikes))
        .curve(d3.curveNatural);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#d62728")
        .attr("stroke-width", 2)
        .attr("d", line);
});

