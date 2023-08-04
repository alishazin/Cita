var formData;

function onLoad() {
    document.querySelector("nav a.item:nth-of-type(2)").classList += " active";

    initializeFormData();
}

function initializeFormData() {
    formData = {
        sun: {
            parent: document.querySelector("div.field-box.details.sun"),
            countInput: document.querySelector("input#sun_count"),
            itemsCount: Number(document.querySelector("input#sun_count").value),
        },
        mon: {
            parent: document.querySelector("div.field-box.details.mon"),
            countInput: document.querySelector("input#mon_count"),
            itemsCount: Number(document.querySelector("input#mon_count").value),
        },
        tue: {
            parent: document.querySelector("div.field-box.details.tue"),
            countInput: document.querySelector("input#tue_count"),
            itemsCount: Number(document.querySelector("input#tue_count").value),
        },
        wed: {
            parent: document.querySelector("div.field-box.details.wed"),
            countInput: document.querySelector("input#wed_count"),
            itemsCount: Number(document.querySelector("input#wed_count").value),
        },
        thu: {
            parent: document.querySelector("div.field-box.details.thu"),
            countInput: document.querySelector("input#thu_count"),
            itemsCount: Number(document.querySelector("input#thu_count").value),
        },
        fri: {
            parent: document.querySelector("div.field-box.details.fri"),
            countInput: document.querySelector("input#fri_count"),
            itemsCount: Number(document.querySelector("input#fri_count").value),
        },
        sat: {
            parent: document.querySelector("div.field-box.details.sat"),
            countInput: document.querySelector("input#sat_count"),
            itemsCount: Number(document.querySelector("input#sat_count").value),
        },
        addItem: function(day) {
            const list = this[day].parent.querySelector("div.details-list");
            const nextCount = this[day].itemsCount + 1;
            this[day].countInput.value = nextCount;

            const newItem = document.createElement('div');
            newItem.classList = 'list-item';
            newItem.innerHTML = `
                <div>
                    <span class="me-2">From</span> <input type="time" name="${day}_${nextCount}_from" class="me-4"> 
                </div>
                <div>
                    <span class="me-2">To</span><input type="time" name="${day}_${nextCount}_to" class="me-4">
                </div>
                <div>
                    <span class="me-2">Price</span><input type="number" name="${day}_${nextCount}_price" style="width:80px;" class="me-4">
                </div>
                <div>
                    <span class="me-2">Total slots</span><input type="number" name="${day}_${nextCount}_slots" style="width:80px;" class="me-2">
                </div>
            `;
            list.appendChild(newItem);
            // Directly adding as innerHTML causing others to reset.

            this[day].itemsCount = nextCount;
        },
        removeItem: function(day) {

            if (this[day].itemsCount > 1) {
                this[day].parent.querySelector("div.details-list div.list-item:last-of-type").remove();
                this[day].itemsCount = this[day].itemsCount - 1;
                this[day].countInput.value = this[day].itemsCount;
            }

        }
    };


}

function onTypingCheckName() {
    const field = document.querySelector("input#name");
    const span = document.querySelector("div.field-box.name span");
    const icon = document.querySelector("div.field-box.name i");

    const value = field.value.trim().toLowerCase();

    if (value.length >= 3) {
        const requestObj = new XMLHttpRequest()
        requestObj.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                const json = JSON.parse(this.responseText);

                if (json.exist === true) {
                    span.innerText = `'${json.name}' is taken.`;
                    span.classList = 'red';
                    icon.classList = 'bi bi-x-circle red'
                } else {
                    span.innerText = `${json.name}' is available.`;
                    span.classList = 'green';
                    icon.classList = 'bi bi-check-circle-fill green'
                }
            }
        }

        requestObj.open("GET", `/home/my-organizations/create-org/check-name-exist?name=${value}`)
        requestObj.send()
    } else {
        span.innerText = '';
        span.classList = '';
        icon.classList = ''
    }

}

function onClickCheckBox(id) {
    const checkbox = document.querySelector(`div.checkbox.${id}`);
    const input = document.querySelector(`input#${id}`);

    if (input.checked === true) {
        input.click();
        checkbox.classList = `checkbox ${id}`;
        formData[id].parent.style.display = 'none';
    } else {
        input.click();
        checkbox.classList = `checkbox ${id} checked`;
        formData[id].parent.style.display = 'block';
    }
}

function slideBarController() {
    const pausedDiv = document.querySelector("div.sliderbar-box.paused");
    const activeDiv = document.querySelector("div.sliderbar-box.active");

    const pausedOption = document.querySelector("select#status #paused");
    const activeOption = document.querySelector("select#status #active");

    if (pausedDiv) {
        pausedDiv.classList = "sliderbar-box active";
        pausedOption.selected = "0";
        activeOption.selected = "1";
        
    } else {
        activeDiv.classList = "sliderbar-box paused";
        activeOption.selected = "0";
        pausedOption.selected = "1";
    }
}