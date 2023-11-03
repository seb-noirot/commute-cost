document.addEventListener("DOMContentLoaded", loadValuesFromStorage);

let commuteChart; // Declare this at the top

function generateChart() {
    const hourlySalary = parseFloat(document.getElementById("hourlySalary").value);
    const commuteTime = parseFloat(document.getElementById("commuteTime").value) / 60; // Convert to hours
    const commuteCost = parseFloat(document.getElementById("commuteCost").value);
    const weeksPerYear = parseFloat(document.getElementById("weeksPerYear").value);
    const currencySymbol = document.getElementById("currency").options[document.getElementById("currency").selectedIndex].text;

    const ticketCostData = [];
    const timeLostCostData = [];
    const totalTimeLostData = [];

    for (let i = 1; i <= 5; i++) {
        const totalTicketCost = commuteCost * i * weeksPerYear;
        const totalTimeLost = commuteTime * i * weeksPerYear;
        const timeLostCost = totalTimeLost * hourlySalary;

        ticketCostData.push(totalTicketCost);
        timeLostCostData.push(timeLostCost);
        totalTimeLostData.push(totalTimeLost);
    }

    const ctx = document.getElementById('commuteChart').getContext('2d');
    if (commuteChart) commuteChart.destroy(); // Destroy the previous chart instance if it exists

    commuteChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1x/week', '2x/week', '3x/week', '4x/week', '5x/week'],
            datasets: [{
                label: `Ticket Costs in ${currencySymbol}`,
                data: ticketCostData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                yAxisID: 'y1',
                stack: 'combined'
            },
                {
                    label: `Time Lost Costs in ${currencySymbol}`,
                    data: timeLostCostData,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    stack: 'combined'
                },
                {
                    type: 'line',
                    label: 'Hours Lost',
                    data: totalTimeLostData,
                    fill: false,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    tension: 0.1, // This makes the line smooth
                    yAxisID: 'y2'
                }]
        },
        options: {
            scales: {
                y1: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    stacked: true,  // This will stack the bars
                    title: {
                        display: true,
                        text: 'Cost'
                    }
                },
                y2: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }, plugins: {
                tooltip: {
                    enabled: false,
                    position: 'nearest',
                    external: externalTooltipHandler
                }
            }
        }
    });
}


function calculate() {
    const commuteCost = parseFloat(document.getElementById("commuteCost").value);
    const commuteTime = parseFloat(document.getElementById("commuteTime").value) / 60; // Convert to hours
    const hourlySalary = parseFloat(document.getElementById("hourlySalary").value);
    const timesPerWeek = parseFloat(document.getElementById("timesPerWeek").value);
    const weeksPerYear = parseFloat(document.getElementById("weeksPerYear").value);
    const currency = document.getElementById("currency").value;
    const currencySymbol = document.getElementById("currency").options[document.getElementById("currency").selectedIndex].text;

    const totalTicketCost = commuteCost * timesPerWeek * weeksPerYear;
    const totalTimeLost = commuteTime * timesPerWeek * weeksPerYear;
    const timeLostCost = totalTimeLost * hourlySalary;
    const totalCost = totalTicketCost + timeLostCost;

    document.getElementById("result").innerText = totalCost.toFixed(0) + currencySymbol;
    document.getElementById("ticketCost").innerText = totalTicketCost.toFixed(0) + currencySymbol;
    document.getElementById("timeLostHours").innerText = totalTimeLost.toFixed(2);
    document.getElementById("timeLostCost").innerText = timeLostCost.toFixed(0) + currencySymbol;

    generateChart();

    // Save values to local storage
    saveValuesToStorage(commuteCost, commuteTime * 60, hourlySalary, timesPerWeek, weeksPerYear, currency);
}


const externalTooltipHandler = (context) => {
    // Tooltip Element
    const { chart, tooltip } = context;
    const tooltipEl = getOrCreateTooltip(chart);

    // Hide if no tooltip
    if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    // Set Text
    if (tooltip.body) {
        const index = tooltip.dataPoints[0].dataIndex;

        const ticketCost = chart.data.datasets[0].data[index];
        const timeLostCost = chart.data.datasets[1].data[index];
        const totalTimeLost = chart.data.datasets[2].data[index];
        const totalCost = ticketCost + timeLostCost;
        const currencySymbol = document.getElementById("currency").options[document.getElementById("currency").selectedIndex].text;

        const tableHead = document.createElement('thead');
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.appendChild(document.createTextNode('Details'));
        tr.appendChild(th);
        tableHead.appendChild(tr);

        const tableBody = document.createElement('tbody');

        const rows = [
            { label: "Total Cost", value: `${totalCost.toFixed(0)} ${currencySymbol}` },
            { label: "Ticket Costs", value: `${ticketCost.toFixed(0)} ${currencySymbol}` },
            { label: "Time Lost Costs", value: `${timeLostCost.toFixed(0)} ${currencySymbol}` },
            { label: "Total Time Lost", value: `${totalTimeLost.toFixed(2)} hours` }
        ];

        rows.forEach(row => {
            const tr = document.createElement('tr');
            const tdLabel = document.createElement('td');
            const tdValue = document.createElement('td');
            tdLabel.appendChild(document.createTextNode(row.label));
            tdValue.appendChild(document.createTextNode(row.value));
            tr.appendChild(tdLabel);
            tr.appendChild(tdValue);
            tableBody.appendChild(tr);
        });

        const tableRoot = tooltipEl.querySelector('table');

        // Remove old children
        while (tableRoot.firstChild) {
            tableRoot.firstChild.remove();
        }

        // Add new children
        tableRoot.appendChild(tableHead);
        tableRoot.appendChild(tableBody);
    }

    const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

    // Display, position, and set styles for font
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = positionX + tooltip.caretX + 'px';
    tooltipEl.style.top = positionY + tooltip.caretY + 'px';
    tooltipEl.style.font = tooltip.options.bodyFont.string;
    tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
};

const getOrCreateTooltip = (chart) => {
    let tooltipEl = chart.canvas.parentNode.querySelector('div');

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
        tooltipEl.style.borderRadius = '3px';
        tooltipEl.style.color = 'white';
        tooltipEl.style.opacity = 1;
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.transform = 'translate(-50%, 0)';
        tooltipEl.style.transition = 'all .1s ease';

        const table = document.createElement('table');
        table.style.margin = '0px';

        tooltipEl.appendChild(table);
        chart.canvas.parentNode.appendChild(tooltipEl);
    }

    return tooltipEl;
};

function saveValuesToStorage(commuteCost, commuteTime, hourlySalary, timesPerWeek, weeksPerYear, currency) {
    localStorage.setItem("commuteCost", commuteCost);
    localStorage.setItem("commuteTime", commuteTime);
    localStorage.setItem("hourlySalary", hourlySalary);
    localStorage.setItem("timesPerWeek", timesPerWeek);
    localStorage.setItem("weeksPerYear", weeksPerYear);
    localStorage.setItem("currency", currency);
}

function loadValuesFromStorage() {
    if (localStorage.getItem("commuteCost")) {
        document.getElementById("commuteCost").value = localStorage.getItem("commuteCost");
        document.getElementById("commuteTime").value = localStorage.getItem("commuteTime");
        document.getElementById("hourlySalary").value = localStorage.getItem("hourlySalary");
        document.getElementById("timesPerWeek").value = localStorage.getItem("timesPerWeek");
        document.getElementById("weeksPerYear").value = localStorage.getItem("weeksPerYear");
        document.getElementById("currency").value = localStorage.getItem("currency");
    }
}
