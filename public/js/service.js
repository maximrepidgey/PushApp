async function retrieveCoachId() {
    let obj = await fetch('/auth/getuserinfo');
    obj = await obj.json();
    return obj.userAccountId;
}

async function getServices(){
    try{
        let servicesFound = await fetch('/coaches/services/' + await retrieveCoachId(), {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            }
        });
        let services = await servicesFound.json();
        return services;
    }catch(e){
        console.log(e);
        return undefined;
    }
}

async function getService(_id){
    try{
        let servicesFound = await fetch('/coaches/services/' + _id, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            }
        });
        let services = await servicesFound.json();
        return services;
    }catch(e){
        console.log(e);
        return undefined;
    }
}

async function postServices(body){
    try{
        let createService = await fetch('/coaches/services/new', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            },
            body: JSON.stringify(body)
        });
        let createdService = await createService.json();
        return createdService;
    }catch(e){
        console.log(e);
        return undefined;
    }
}

async function putServices(body, id){
    try{
        let modifyService = await fetch('/coaches/services/edit/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            },
            body: JSON.stringify(body)
        });
        let modifiedService = await modifyService.json();
        return modifyService;
    }catch(e){
        console.log(e);
        return undefined;
    }
}

async function deleteServices(id){
    try{
        let deleteService = await fetch('/coaches/services/delete/' + id, {
            method: 'DELETE',
            headers: {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            }
        });
        let deletedService = await deleteService.json();
        return deletedService;
    }catch(e){
        console.log(e);
        return undefined;
    }
}

function resetDocument(){
    let container = document.getElementsByClassName("container")[0];
    container.innerHTML = '';
}

async function serviceInitialize(){
    let container = document.getElementsByClassName("container")[0];
    resetDocument();
    try{
        let services = await getServices();
        dust.render("dashboard_partials/services", { services: services }, function(err, out) {
            container.innerHTML = out;
        });
    }catch(e){
        console.log(e);
        return undefined;
    }
}

function windowToNewService(){
    let container = document.getElementsByClassName("container")[0];
    resetDocument();
    dust.render("coaches_services_new", {}, function(err, out) {
        container.innerHTML = out;
    });
}

async function newService(){
    let name = document.getElementsByName("name")[0].value;
    let duration = document.getElementsByName("duration")[0].value;
    let fee = document.getElementsByName("fee")[0].value;
    let description = document.getElementsByName("description")[1].value;
    // if(!name){
    //     console.log("name");
    // }
    // let isNumber = /^\d+$/;
    // if(!duration || isNumber.test(duration)){
    //     console.log("PUT RIGHT duration");
    // }
    // if(!fee || isNumber.test(fee)){
    //     console.log("PUT RIGHT fee");
    // }
    // if(!description){
    //     console.log("description");
    // }
    let body = {
        _coachId: await retrieveCoachId(),
        name : name,
        duration: duration,
        fee: fee,
        description: description
    };
    await postServices(body);
    await serviceInitialize();
}

async function windowToEditService(event){
    let parent = event.target.parentNode.parentNode;
    let serviceId = parent.childNodes[0].childNodes[5].value;
    let container = document.getElementsByClassName("container")[0];
    resetDocument();
    dust.render("coaches_services_edit", {}, function(err, out) {
        container.innerHTML = out;
    });
    let found = await getService(serviceId);
    document.getElementsByName("name")[0].value = found[0].name;
    document.getElementsByName("duration")[0].value = found[0].duration;
    document.getElementsByName("fee")[0].value = found[0].fee;
    document.getElementsByName("description")[1].value = found[0].description;
    document.getElementsByName("_id")[0].value = serviceId;
}

async function editService(event){
    let name = document.getElementsByName("name")[0].value;
    let duration = document.getElementsByName("duration")[0].value;
    let fee = document.getElementsByName("fee")[0].value;
    let description = document.getElementsByName("description")[1].value;
    let body = {
        name: name,
        duration: duration,
        fee: fee,
        description: description
    };
    let serviceId = document.querySelectorAll('input')[0].value;
    await putServices(body, serviceId);
    await serviceInitialize();
}

async function deleteService(event) {
    let parent = event.target.parentNode.parentNode;
    let serviceId = parent.childNodes[0].childNodes[5].value;
    await deleteServices(serviceId);
    await serviceInitialize();
}

async function showServices(e){
    e.preventDefault();
    let id = e.target.name;
    let services;
    try {
        let headers = {
            'Content-Type' : 'application/json',
            'Accept' : 'application/json'
        };
        let res = await fetch('/coaches/services/' + id,
            {
                method: "GET",
                headers: headers
            });
        services = await res.json();
    }catch(e){
        throw e;
    }
    document.getElementById("grid").remove();
    let div = document.createElement("div");
    div.id = "grid";
    let parent = document.getElementById("divtitle");
    parent.appendChild(div);

    for(let i = 0 ; i < services.length;i++) {
        dust.render("dashboard_partials/services_coachesList", {service: services[i], text:"Go to payment"}, (err,out)=>{
            div.innerHTML+=out;
        });
    }
    let searchBox = document.getElementById("searchBox");
    searchBox.children[0].remove();
    let toAdd = document.createElement("input");
    toAdd.id = 'ss';
    toAdd.type = 'text';
    toAdd.class = 'validate';
    searchBox.appendChild(toAdd);
    document.getElementById("ss").addEventListener('keyup', () => {
        searchService(id)
    });
}

async function searchService(_coachId){
    let text = document.getElementById('ss').value;
    let services;
    try{
        let headers = {
            'Content-Type' : 'application/json',
            'Accept' : 'application/json'
        };
        let foundService = await fetch('/coaches/services/search?_coachId=' + _coachId + '&name=' + text,
            {
                method: "GET",
                headers: headers
            });
        services = await foundService.json();
        let servicesLenght = services.length;
        if(servicesLenght > 0){
            displayService(services);
        }
    }catch(e){
        throw e;
    }
}

function displayService(services){
    let servicesLength = services.length;
    let grid = document.getElementById('grid');
    let gridChildren = grid.children;
    for(let i = gridChildren.length - 1; i >= 0; i--){
        gridChildren[i].remove();
    }
    for(let i = 0; i < servicesLength; i++){
        dust.render("dashboard_partials/services_coachesList", {service: services[i], text:"Go to payment"}, (err,out)=>{
            grid.innerHTML += out;
        });
    }
}