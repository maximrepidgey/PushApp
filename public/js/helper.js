function gotoCheckout(e) {
    e.preventDefault();
    orderData.serviceId = e.target.name;
    dust.render("checkout", {}, function (err, out) {
        document.getElementById("searchBox").remove();
        document.getElementById("grid").innerHTML = out;
    });
    initStripe();
}

let orderData = {
    items: [{id: "PushApp membership"}],
    serviceId: ""
};

function fetchClient(e) {
    e.preventDefault();
    fetch('/register/client', {method: "GET"})
        .then(res => res.text())
        .then((text) => {
            console.log(text);
            let container = document.getElementById("container-register");
            container.classList.add("grey");
            container.classList.add("darken-3");
            container.classList.add("register-card");
            let register = document.getElementById("reg");
            register.classList.remove("register-form");
            register.innerHTML = text;
        });
}

function fetchCoach(e) {
    e.preventDefault();
    console.log("HERE");
    fetch('/register/coach', {method: "GET"})
        .then(res => res.text())
        .then((text) => {
            let container = document.getElementById("container-register");
            container.classList.add("grey");
            container.classList.add("darken-3");
            container.classList.add("register-card");
            let register = document.getElementById("reg");
            register.classList.remove("register-form");
            register.innerHTML = text;
        });
}

/*sets image to default (in part)*/
function deleteButton() {
    let pic = document.getElementById("im");
    let div = document.getElementsByClassName("cut-image")[0];
    document.getElementById('putimage').value = '';
    pic.src = "";
    div.className = "";
    pic.className = "";
}

function getImage() {
    let file = document.getElementById("image").files[0];
    let height;
    let width;
    console.log(file);
    let fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = function () {
        let data = fileReader.result;
        let image = new Image();
        image.src = data;
        image.onload = function () {
            height = this.height;
            width = this.width;
            let pic = document.getElementById("im");
            let form;
            if (height === width) {
                pic.className = 'profile-square-image';
                form = 'square';
            } else if (width > height) {
                pic.className = 'profile-rec-image';
                form = 'rec';
            } else {
                pic.className = 'profile-port-image';
                form = 'port';
            }
            console.log("width ", width);
            console.log("height: ", height);
            document.getElementById("form").value = form;
            pic.src = data;
            document.getElementById("putimage").value = data;
        }
    };
}

async function fetchRating() {
    // e.preventDefault();
    try {
        let res = await fetch('/clients/rating');
        return await res.text();
    } catch (e) {
        console.log(e);
    }

}

function starsRating(e) {
    e.preventDefault();
    let uncolorClass = "unchecked fa fa-star";
    let colorClass = "fa fa-star checked";
    let save = e.target.nextSibling;
    let child = e.target;
    //color the stars
    while (child != null) {
        console.log(child);
        child.className = colorClass;
        child = child.previousSibling;
    }
    //uncolor the stars
    while (save != null) {
        save.className = uncolorClass;
        save = save.nextSibling;
    }
}

function addReview(e, id) {
    console.log(id);
    e.preventDefault();
    let rating = 0;
    let first = document.getElementById("firstStar");
    while (first != null) {
        if (first.className === "fa fa-star checked") {
            ++rating;
        }
        first = first.nextSibling;
    }
    let comment = document.getElementById("commentReview");
    let title = document.getElementById("titleReview");
    if (!title.checkValidity() || !comment.checkValidity()) {
        document.getElementById("alert").innerText = "Please fill all fields";
    } else {
        comment = comment.value;
        title = title.value;
        document.getElementById("alert").innerText = "";
        fetch('/workouts/finish-workout', {
            method: "POST",
            body: JSON.stringify({
                score: rating,
                title: title,
                comment: comment,
                id: id, //id of coach,
                new: 'Y'
            }),
            headers: {
                'content-type': 'application/json',
                'accept': 'text/html'
            },
        })
            .then(res => res.text())
            .then(window.location.reload())
            .catch((err) => console.log(err))
    }
}


function changeRev(objId) {
    let comment = document.getElementById("commentReview");
    let title = document.getElementById("titleReview");
    if (!title.checkValidity() || !comment.checkValidity()) {
        document.getElementById("alert").innerText = "Please fill all fields";
    } else {
        comment = comment.value;
        title = title.value;
        document.getElementById("alert").innerText = "";
        let rating = 0;
        let first = document.getElementById("firstStar");
        while (first != null) {
            if (first.className === "fa fa-star checked") {
                ++rating;
            }
            first = first.nextSibling;
        }
        fetch('/workouts/finish-workout', {
            method: "POST",
            headers: {
                'content-type': 'application/json',
                'accept': 'text/html'
            },
            body: JSON.stringify({
                score: rating,
                title: title,
                comment: comment,
                objId: objId,
                new: 'N'
            })
        })
            .then((res) => res.text())
            .then(window.location.reload())
            .catch(err => console.log(err))
    }
}

function noReviewChange() {
    fetch('/workouts/finish-workout', {
        method: "POST",
        headers: {
            'content-type': 'application/json',
            'accept': 'text/html'
        },
        body: JSON.stringify({
            new: 'X'
        })
    })
        .then((res) => res.text())
        .then(window.location.reload())
        .catch(err => console.log(err))
}

/*_______________00__________________
________________0000_________________
_______________000000________________
____00_________000000__________00____
_____0000______000000______00000_____
_____000000____0000000___0000000_____
______000000___0000000_0000000_______
_______0000000_000000_0000000________
_________000000_00000_000000_________
_0000_____000000_000_0000__000000000_
__000000000__0000_0_000_000000000____
_____000000000__0_0_0_000000000______
_________0000000000000000____________
______________000_0_0000_____________
____________00000_0__00000___________
___________00_____0______00__________
YOU HAVE FOUND AN EASTER EGG
*/

function changeReview(e, objId) {
    e.preventDefault();
    document.getElementById("titleReview").disabled = false;
    document.getElementById("commentReview").disabled = false;
    document.getElementById("buttons").innerHTML = '<input class="waves-effect white waves-light btn-large" id="rate" type="button" value="Rate">';
    document.getElementById("rate").addEventListener("mousedown", function () {
        changeRev(objId)
    })
    document.querySelectorAll("SPAN").forEach((el) => {
        el.addEventListener("mousedown", starsRating)
    });
}

getUser = async () => {
    let obj = await fetch('/auth/getuserinfo');
    obj = await obj.json();
    return obj.username;
};

async function redirectDashboard() {
    return window.location.assign("/" + await getUser());
}
