function buttons(){
    let buttons = document.querySelectorAll('.no-padding ul li a');
    let buttonClients = buttons[1];
    buttonClients.addEventListener("click", () => {
        renderStyle();//added
        renderClients();
    });

    let buttonService = buttons[2];
    buttonService.addEventListener("click", () => {
        serviceInitialize();
    });

    let buttonDashboard = buttons[0];
    buttonDashboard.addEventListener("click", () => {
        location.reload();
    });
}

renderStyle = async() =>{
    resetDocument();
    let container = document.getElementsByClassName("container")[0];
    dust.render('dashboard_partials/clients',{}, (err, out) => {
        console.log(out);
        container.innerHTML += out;
    });
};


async function renderClients(){

    let hiringClients = await getHiringClients();
    let clients = [];
    let birthdays = [];
    for(let i = 0; i < hiringClients.length; i++){
        let client = await getClientAccount(hiringClients[i]._clientId);
        let clientJson = await client.json();
        let birthday = clientJson[0].birthday.substring(0, 10);
        let birthdayJson = {
            birthday: birthday,
        };
        clients.push(clientJson[0]);
        birthdays.push(birthdayJson);
    }
    if(clients.length !== 0) {
        displayClients(clients, birthdays);
    }
}

displayClients = (clients, birthdays) =>{

    cleanCards();
    let grid = document.getElementById("grid");
    for (let i = 0; i < clients.length; i++) {
        dust.render('dashboard_partials/client_card_for_list', {client: clients[i], birthday: birthdays}, (err, out) => {
            grid.innerHTML += out;
        })
    }
};
cleanCards = () => {
    let children = document.getElementById("grid").childNodes;
    for (let i = 0; i < children.length; i++) {
        children[i].remove();
    }
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

searchClients = async()=>{
    let nonformatted_txt = document.getElementById("last_name").value;
    let txt = toCamelCase(nonformatted_txt);
    if (txt === '' || txt === " ") {
        cleanCards();
        await renderClients();
        return;
    }

    let hiringClients  = await getHiringClients();

    let clients = [];

    for(let i = 0; i < hiringClients.length; i++){
        let client = await getClientAccount(hiringClients[i]._clientId);
        let clientJson = await client.json();
        clients.push(clientJson[0]);
    }
    let foundClients = [];

    for(let i = 0; i < clients.length; i++ ){
        if(txt === clients[i].firstName){
            foundClients.push(clients[i]);
        }
    }
    cleanCards();
    await displayClients(foundClients);
};
