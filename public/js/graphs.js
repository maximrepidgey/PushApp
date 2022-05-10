var canvas = document.getElementById('myChart');
var ctx = canvas.getContext('2d');

let chart;

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

updateChart = async () => {
    try {
        let dropdown = document.getElementById("day-picker-progress");
        let day = dropdown.options[dropdown.selectedIndex].value;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let body = {day: day};
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        let res = await fetch("/workouts/statistics/", {method: "POST", body: JSON.stringify(body), headers});
        res = await res.json();
        let exercises = res.exercises;
        if (exercises == null) {
            return;
        }
        let names = res.exerciseNames;
        console.log(exercises);
        let datesArray = [];
        exercises[0].forEach(ex => {
            datesArray.push(ex.date.slice(0, 10));
        });

        let dataSets = [];
        exercises.forEach((exercise, index) => {
            let weightsArray = [];
            exercise.forEach(ex => {
                weightsArray.push(ex.weight);
            });
            let data = {
                data: weightsArray,
                label: names[index],
                borderColor: getRandomColor(),
                fill: false
            };
            dataSets.push(data);
        });

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: datesArray,
                datasets: dataSets
            },
            options: {
                title: {
                    display: true,
                    text: 'Congratulations! This is your progress!'
                }
            }
        });
    } catch (e) {
        console.log(e);
    }
};


loadSessionPicker();

/*var myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [{
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }
});*/
