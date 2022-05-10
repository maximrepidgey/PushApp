const canvas = document.getElementById('myChart');
const ctx = canvas.getContext('2d');

let chart;

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

async function updateChart() {
    try {
        let dropdown = document.getElementById("stats-picker");
        let option = dropdown.options[dropdown.selectedIndex].value;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        let res = await fetch("/statistics/" + option, {method: "GET", headers});
        res = await res.json();
        let stats = res.stats;
        if (stats == null) {
            return;
        }

        let namesArray = Object.keys(stats);
        let dataArray = Object.keys(stats).map(function (_) {
            return stats[_];
        })
        let dataSets = [];
        dataArray.forEach((exercise, index) => {
            let data = {
                data: dataArray,
                label: namesArray[index],
                borderColor: getRandomColor(),
                fill: false
            };
            dataSets.push(data);
        });

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: namesArray,
                datasets: dataSets
            },
            options: {
                title: {
                    display: false,
                    text: 'Stats!'
                }
            }
        });
    } catch (e) {
        console.log(e);
    }
};

