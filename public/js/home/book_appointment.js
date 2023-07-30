
function onLoad() {
    document.querySelector("nav a.item:nth-of-type(1)").classList += " active";

    addOnInputForSearchOrg();
    addMinDateToPicker();
}

function addOnInputForSearchOrg() {
    const field = document.querySelector("section#banner div.search-bar input#name");

    field.oninput = async function () {
        try {
            document.querySelector("section#banner div.search-bar input#name").style.backgroundColor = 'white';
            const result = await sendReqForOrgSearch(field.value);
            addDropDownItems(result);
        } catch(err) {
            alert("Something went wrong, try refreshing.");
        }
    }
}

function addDropDownItems(names) {
    html = '';
    for (let name of names) {
        html += `<div class="row" onclick="addContentToNameField(this.innerText)">${name}</div>`
    }

    document.querySelector("section#banner div.dropdown").innerHTML = html;
}

async function sendReqForOrgSearch(name) {

    return new Promise(function (resolve, reject) {

        const requestObj = new XMLHttpRequest()
        requestObj.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) resolve(JSON.parse(this.responseText))
            else if (this.readyState == 4 && this.status == 400) reject()
        }
    
        requestObj.open("GET", `/home/book-appointment/search-organization?name=${name}`)
        requestObj.send()
    })
}

function addContentToNameField(name) {
    document.querySelector("section#banner div.search-bar input#name").focus();
    document.querySelector("section#banner div.search-bar input#name").value = name;
    document.querySelector("section#banner div.dropdown").innerHTML = '';
    document.querySelector("section#banner div.search-bar input#name").style.backgroundColor = '#e8f0fe';
}

function addMinDateToPicker() {
    const date = new Date().toLocaleDateString('fr-ca');
    document.querySelector("section#banner div.search-bar input#date").min = date;
}