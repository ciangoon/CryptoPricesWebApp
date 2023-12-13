import CoinbaseExchange from "./coinbase.js";

// Define currency symbols for display
const currencySymbols = {
    "USD": "$",
    "EUR": "€",
    "BTC": "₿",
    "ETH": "Ξ",
    "GBP": "£",
    "USDC": "$", 
    "DAI": "DAI",
    "USDT": "₮"  
};

// Format date to fit the x-axis of the chart
function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM'; // Determine if it's AM or PM
    hours = hours % 12;
    hours = hours ? hours : 12; // hour '0' should be '12'
    const minutes = date.getMinutes().toString().padStart(2, '0'); // ensure minutes is two digits
    const seconds = date.getSeconds().toString().padStart(2, '0'); // ensure seconds is two digits

    return `${day}, ${month} ${dayOfMonth}, ${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

// Define myChart globally so can be accessed by updateChart()
let myChart;

// initialise global granularity variable and global start variable
// so can be accessed by both event listeners
let currentGranularity = 3600; // Default to 1 hour
let currentEndDate = new Date();
let currentStartDate = new Date(currentEndDate.getTime() - 604800000).toISOString(); // Default to 1 week

// Renders the chart using Chart.js
async function renderChart(productId) {
    try {
        // Update the page title to include the trading pair
        document.title = `${productId} Chart`;

        // Instantiate the CoinbaseExchange class to execute fetchCandlestickData()
        const exchange = new CoinbaseExchange();
        // Set default startDate to 1 week and granularity to 1 hour 
        const candlestickData = await exchange.fetchCandlestickData(productId,currentGranularity,currentStartDate);

        // Process the data for Chart.js
        // Data format is [timestamp, price_low, price_high, price_open, price_close]
        const processedData = candlestickData.map(d => {
            return {
                // Convert UNIX timestamp to JavaScript Date object 
                x: new Date(d[0] * 1000),
                y: d[4] // Closing price
            };
        }); 
        // Define vertical line plugin
        const verticalLinePlugin = {
            id: 'verticalLinePlugin',
            beforeDraw: function (chart) {
            if (chart.tooltip._active && chart.tooltip._active.length) {
                const ctx = chart.ctx;
                const x = chart.tooltip._active[0].element.x;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;
                
                // Draw the line
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#007BFF'; // Blue color
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.restore();
                }
            }
        };
        // Store the last hovered price
        let lastHoveredPrice = ''; 
        let symbol = currencySymbols[quoteCurrency];

        const ctx = document.getElementById('coinbaseChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'line', // Can change to 'bar' or other types
            data: {
                labels: processedData.map(d => formatDate(d.x)),
                datasets: [{
                    label: `${productId}`,
                    data: processedData.map(d => d.y),
                    backgroundColor: 'rgba(0, 123, 255, 0.5)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    pointRadius: 1
                }]
            },
            plugins: [verticalLinePlugin],
            options: {
                maintainAspectRatio: true,
                responsive: true,
                plugins: {
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                // Retrieve y value using context.parsed.y
                                const price = new Intl.NumberFormat('en-US', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 8 
                                }).format(context.parsed.y);
                                document.getElementById('priceDisplay').textContent = `${symbol} ${price}`;
                                return `${context.dataset.label}: ${symbol} ${price}`;
                            }
                        }
                    }
                },
                // Hover configuration is directly inside the options object
                // 'event' is not used since mouse only hovers and does not need to click
                onHover: (event, chartElement) => {
                    if (chartElement.length) {
                        const chart = chartElement[0].element.chart;
                        const dataIndex = chartElement[0].element.index;
                        const datasetIndex = chartElement[0].element.datasetIndex;
                        // Format the number with commas and at least two decimal places 
                        const price = new Intl.NumberFormat('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 8 
                        }).format(chart.data.datasets[datasetIndex].data[dataIndex].y);
                        lastHoveredPrice = `${symbol} ${price}`; // Update the last hovered price
                        document.getElementById('priceDisplay').textContent = lastHoveredPrice;
                    } else {
                        // When not hovering over a data point, show the last hovered price
                        if (lastHoveredPrice) {
                            document.getElementById('priceDisplay').textContent = lastHoveredPrice;
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 15 // reduce no. of ticks if overcrowded
                        }
                    },
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error rendering chart:", error);
        // Handle the error in the UI, e.g., show an error message
    }
}

// Update chart according to granularity 
async function updateChart(granularity, start) {
    // Retrieve productId from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');

    try {
        // Instantiate the CoinbaseExchange class to execute fetchCandlestickData()
        const exchange = new CoinbaseExchange();
        const candlestickData = await exchange.fetchCandlestickData(productId, granularity, start);

        // Process the data for Chart.js
        // Data format is [timestamp, price_low, price_high, price_open, price_close]
        const processedData = candlestickData.map(d => {
            return {
                x: new Date(d[0] * 1000), // Convert UNIX timestamp to JavaScript Date object
                y: d[4] // Closing price
            };
        });

        // Update chart 
        myChart.data.labels = processedData.map(d => formatDate(d.x));
        myChart.data.datasets[0].data = processedData.map(d => d.y);
        myChart.update();
        
    } catch (error) {
        console.error("Error updating chart:", error);
        // Handle the error in the UI, e.g., show an error message
    }
}

// Event listener for granularity drop-down list
document.addEventListener('DOMContentLoaded', () => {
    const granularitySelect = document.getElementById('granularitySelect');
    granularitySelect.addEventListener('change', function() {
        currentGranularity = this.value;
        // Handle the change, update the chart
        updateChart(currentGranularity, currentStartDate);
    });
});

// Event listener for date range buttons
document.addEventListener('DOMContentLoaded', () => {
    const dateRangeButtons = document.querySelectorAll('.update-date-button');

    // Iterate through each button
    dateRangeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove the active class from all buttons
            dateRangeButtons.forEach(btn => btn.classList.remove('active'));

            // Add the active class to the clicked button
            this.classList.add('active');

            const range = this.getAttribute('date-range');
            const endDate = new Date(); // Current date as end date
            let startDate;

            switch (range) {
                case '1h':
                    startDate = new Date(endDate.getTime() - 3600000); // 1 hour 
                    break;
                case '1d':
                    startDate = new Date(endDate.getTime() - 86400000); // 1 day 
                    break;
                case '1w':
                    startDate = new Date(endDate.getTime() - 604800000); // 1 week 
                    break;
                case '1m':
                    startDate = new Date(endDate);
                    startDate.setMonth(startDate.getMonth() - 1); // 1 month 
                    break;
                case '1y':
                    startDate = new Date(endDate);
                    startDate.setFullYear(startDate.getFullYear() - 1); // 1 year
                    break;
                case 'all':
                    startDate = new Date(0); // All time 
                    break;
            }
            // Format dates to the required format for API (e.g., ISO string)
            currentStartDate = startDate.toISOString();

            // Call updateChart with the new start date and current granularity value
            updateChart(currentGranularity, currentStartDate);
            // console.log("Updating chart with granularity:", currentGranularity, "and start:", startISO);
        });
    });
});

// Extract productId from the URL and executes renderChart
const productId = new URLSearchParams(window.location.search).get('product_id');
const quoteCurrency = productId.split('-')[1];
if (productId) {
    renderChart(productId);
}