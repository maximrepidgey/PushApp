function attachEventListeners(event) {
    // This gets all the elements that have the specified class name and puts them into arrays
    let chooseServiceButton = document.getElementsByClassName("delete-btn");

    // Then you iterate through all of them and add the event listeners
    for (let i = 0; i < chooseServiceButton.length; i++) {
        chooseServiceButton[i].addEventListener('click', this.deleteImg.bind(this));
    }
}

// This is the delete function invoked everytime you click on the delete button
// The events carries the ID of the element so you can read it using "event.path[2].id" to perform fetches
async function deleteImg(event) {
    try {
        event.preventDefault();
        let headers = {'Accept': 'application/json'};
        let res = await doFetchRequest("DELETE", "/favorites/" + event.path[2].id, headers);
        if (res.status == 200) {
            let dom = event.target.parentNode;
            dom.parentNode.remove();
            this.createSearchBox.bind(this)();
            this.emitSocketMessage('An image was deleted. Sorry you missed it!');
        }
    } catch (err) {
        throw err;
    }
}



