let page;
let exerciseDiv;
let exercises;
let exercisesCounter = 0;
startWorkout = async () => {
  exercisesCounter = 0;
  page = document.getElementsByTagName("html")[0];
  let headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  let res = await fetch("/workouts/begin", {method: "GET", headers});
  res = await res.json();
  exercises = res.exercises;
  console.log(res);
  dust.render("workout", {exercise: exercises[exercisesCounter].exercise}, (err, out) =>
    page.innerHTML = out);
  chronoStart();

};

showFeedbackForm = () => {
  exerciseDiv = document.getElementsByClassName("exercise-div")[0];
  chronoStop();
  if (exercisesCounter < exercises.length - 1) {
    dust.render("feedback-form", {exercise: exercises[exercisesCounter]}, (err, out) => {
      exerciseDiv.innerHTML = out;
    });
  } else {
    dust.render("feedback-form", {exercise: exercises[exercisesCounter], finish: true}, (err, out) => {
      exerciseDiv.innerHTML = out;
    });
  }

};

stopWorkout = async () => {
  exercisesCounter = 0;
  let headers = {
    'Accept': 'text/html',
    'Content-Type': 'application/json'
  };
  page.innerHTML = await fetchRating();
};

submitFeedback = async (event) => {
  chronoContinue();
  event.preventDefault();
  let repetitions = document.getElementById("repetitions").value;
  let sets = document.getElementById("sets").value;
  let weight = document.getElementById("weight").value;
  let comments = document.getElementById("comments").value;
  exerciseDiv = document.getElementsByClassName("exercise-div")[0];
  let headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  let body = {
    repetitions: repetitions,
    sets: sets,
    weight: weight,
    comments: comments,
  };
  //Update values of ExerciseControl
  let res = await fetch("/workouts/update-exercise-control/" + exercises[exercisesCounter].exercise.id, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  res = await res.json();

  if (comments !== "") {
    let msg = {
      from: res.clientId,
      userName: res.clientUsername,
      for: res.coachId,
      exerciseId: exercises[exercisesCounter].exercise.id,
      repetitions: repetitions,
      weight: weight,
      sets: sets,
      comments: comments,
      exerciseName: exercises[exercisesCounter].exercise.name
    };
    //Create the notification in the database
    console.log(res);
    body = {
      from: msg.from,
      for: msg.for,
      exerciseName: msg.exerciseName,
      repetitions: repetitions,
      sets: sets,
      weight: weight,
      comments: comments,
      userName : res.clientUsername,
      typeofMessage : "update", //or text if it's just a text message
    };
    let notification = await fetch("/workouts/notification", {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    notification = await notification.json();
    //Emit the notification
    msg.notificationId = notification.notification._id;
    socket.emit('notification', msg);
  }
  //Continue with the next exercise
  exercisesCounter++;
  if (exercisesCounter === exercises.length) {
    await stopWorkout();
    console.log("finished workout");
    return;
  }
  if (exercisesCounter < exercises.length - 1) {
    dust.render("workout-exercise", {exercise: exercises[exercisesCounter].exercise}, (err, out) =>
      exerciseDiv.innerHTML = out);
  } else {
    dust.render("workout-exercise", {exercise: exercises[exercisesCounter].exercise, finish: true}, (err, out) =>
      exerciseDiv.innerHTML = out);
  }

};

