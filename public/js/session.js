getUserId = async () => {
    let obj = await fetch('/auth/getuserinfo');
    obj = await obj.json();
    return obj.userAccountId;
};

toCamelCase = (text) => {
    let ret = '';
    for (let i = 0; i < text.length; i++) {
        if (i === 0) {
            ret += text.charAt(0).toUpperCase();
        } else {
            ret += text.charAt(i).toLowerCase();
        }
        if (text.charAt(i) === ' ') {
            ret += text.charAt(i + 1).toUpperCase();
            i++;
        }
    }
    return ret;
};

searchCoaches = async () => {
    let nonformatted_txt = document.getElementById("last_name").value;
    let txt = toCamelCase(nonformatted_txt);
    let everyone = await getCoaches();
    if (txt === '' || txt === " ") {
        cleanCards();
        return await displayCoaches(everyone);
    }
    let displayCoachesArray = [];
    for (let i = 0; i < everyone.length; i++) {
        everyone[i].firstName = toCamelCase(everyone[i].firstName);
        if (everyone[i].firstName.includes(txt) || everyone[i].lastName.includes(txt)) {
            displayCoachesArray.push(everyone[i]);
            console.log("FOUND THIS GUY: ", everyone[i].firstName, everyone[i].lastName);
        }
    }
    cleanCards();
    return await displayCoaches(displayCoachesArray);
};

cleanCards = () => {
    let children = document.getElementById("grid").childNodes;
    // console.log(children);
    for (let i = 0; i < children.length; i++) {
        children[i].remove();
    }
};

async function renderCoaches() {
    //container of the page
    let container = document.getElementsByClassName("container")[0];
    container.innerHTML = '';

    let div = document.createElement('div');
    div.className = "row";
    div.id = "divtitle";

    container.appendChild(div);
    dust.render("dashboard_partials/coaches", {}, async function (err, out) {
        div.innerHTML += out;
        let all = await getCoaches();
        await displayCoaches(all);
    });
}

hiredAlready = async (id) => {
    let getting = await fetch("/coaches/hire/coach/" + id, {
        method: "GET",
        headers: {'Content-Type': 'application/json'}
    });
    let clientsArray = await getting.json();
    for (let i = 0; i < clientsArray.length; i++) {
        if (clientsArray[i]._clientId === await getUserId()) {
            return 1;
        }
    }
    return 0;
};

async function getCoaches() {
    let everyone = await fetch("/coaches/search?accountType=coach");
    return await everyone.json();
}

async function getCoachesIndex() {
    let everyone = await fetch("/coaches/public/search?accountType=coach");

    let everyoneArray = await everyone.json();

    let grid = document.getElementById("grid");
    for(let i =0; i < everyoneArray.length; i++){
        console.log(everyoneArray[i]);

        dust.render("dashboard_partials/client_card_for_list", {client: everyoneArray[i]}, ((err,out)=>{
            console.log(out);
            grid.innerHTML += out;
    }));
    }
}

displayCoaches = async (coachesArray) => {
    //leave this one
    cleanCards();
    console.log("ARRAY OF COACHES", coachesArray);

    for (let i = 0; i < coachesArray.length; i++) {
        let response = await fetch('/coaches/ratings', {
            method: "POST",
            body: JSON.stringify({
                coach: coachesArray[i]
            })
        });
        let res = await response.text();
        document.getElementById("grid").innerHTML += res;

        if (await hiredAlready(coachesArray[i]._id)) {
            let buttons = document.getElementsByClassName("white-text");
            console.log("BUTTON ", buttons);
            for (let k = 0; k < buttons.length; k++) {
                console.log("COACHES ARRAY[%d]",i, coachesArray[i]);
                if (buttons[k].name === coachesArray[i]._id) {
                    let span = document.createElement("span");
                    span.innerHTML = "HIRED ALREADY!";
                    span.className = "red-text";

                    let append = buttons[k].parentNode;
                    buttons[k].remove();
                    append.appendChild(span);
                }
            }
        }
    }
};

// Used in client dashboard
async function getExercises() {
    try {
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        let userId = await fetch("/auth/getuserinfo");
        userId = await userId.json();

        let session = await fetch("/workouts/sessions/search?_clientId=" + userId.userAccountId + "&weekday=" + getWeekDay(), {
            method: 'GET',
            headers: headers,
        });

        let exercises = [];
        if (session.status === 200) {
            let foundSession = await session.json();
            let foundExercises = foundSession.exercises;

            for (let i = 0; i < foundExercises.length; i++) {
                let exercise = await fetch('/workouts/exercises/findById/' + foundExercises[i], {
                    method: 'GET',
                    headers: headers
                });

                exercise = await exercise.json();
                await exercises.push(exercise);
            }
        } else {
            exercises = [{
                name: "-",
                description: "-",
                weightUnit: "-",
                pumpWeight: "-",
                weight: "-",
                bodyPart: "-",
                set: "-",
                repetitions: "-",
                comments: "-"
            }];
            document.getElementById("beginWorkout-btn").classList.add("disabled");
        }
        dust.render("dashboard_partials\/schedule_table_row",
            {exercises: exercises}, (err, out) =>
                document.getElementById('scheduleTable').innerHTML = out);
    } catch (err) {
        console.log(err);
    }
}

function getWeekDay() {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return weekdays[new Date().getDay()];
}

getExercises()
    .catch((e) => console.log(e));
