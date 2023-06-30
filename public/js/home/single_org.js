
var WeeklyScheduleObj = {};
var SpecialHolidaysObj = {};

function onLoad() {
    document.querySelector("nav a.item:nth-of-type(2)").classList += " active";
    initializeWeeklySchedule();
    initializeSpecialHolidays();

    let tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    document.querySelector("section#special_holidays div.right-content form input[type='date']").min = tomorrow.toLocaleDateString('fr-ca');
}

function getTimeTextForSchedule(array) {
    if (array[0] > 12) {
        array[0] = array[0] % 12;
        return `${array[0]}:${array[1] == 0 ? "00" : array[1]} pm`
    } else {
        return `${array[0]}:${array[1] == 0 ? "00" : array[1]} am`
    }
}

function initializeWeeklySchedule() {

    WeeklyScheduleObj = {
        tableDiv: document.querySelector('section#weekly_schedule div.table'),
        get leftButton() {
            return document.querySelector('section#weekly_schedule div.table-container div.table div.top-row i.left')
        },
        get rightButton() {
            return document.querySelector('section#weekly_schedule div.table-container div.table div.top-row i.right')
        },
        get dayText() {
            return document.querySelector('section#weekly_schedule div.table-container div.table div.top-row div.box')
        },
        _currentDay: null,
        get currentDay() {
            return this._currentDay;
        },
        set currentDay(arg) {
            if (arg === 0) {
                this.dayText.innerText = "Sun";
            } else if (arg === 1) {
                this.dayText.innerText = "Mon";
            } else if (arg === 2) {
                this.dayText.innerText = "Tue";
            } else if (arg === 3) {
                this.dayText.innerText = "Wed";
            } else if (arg === 4) {
                this.dayText.innerText = "Thu";
            } else if (arg === 5) {
                this.dayText.innerText = "Fri";
            } else if (arg === 6) {
                this.dayText.innerText = "Sat";
            };

            this.setContent(arg);
            this._currentDay = arg;
        },
        setContent(arg) {
            document.querySelectorAll("section#weekly_schedule div.table div.row:not(.top), section#weekly_schedule div.table div.empty-div").forEach(x => x.remove())

            if (weeklyScheduleData[arg] !== null) {
                let count = 1;
                for (let x of weeklyScheduleData[arg]) {
                    this.tableDiv.innerHTML += `
                    <div class="row">
                        <span>${count}</span>
                        <span>${getTimeTextForSchedule(x[0])}</span>
                        <span>${getTimeTextForSchedule(x[1])}</span>
                        <span>${x[2]}</span>
                        <span>${x[3]}</span>
                    </div>
                    `;
                    count++;
                }
            } else {
                this.tableDiv.innerHTML += `
                <div class="empty-div">
                    <img src="/images/home/empty-schedule.webp">
                    <span class="mt-3">Schedule looks empty.</span>
                </div>
                `;
            }
            this.addCallbacks();
        },

        addCallbacks() {
            this.leftButton.onclick = () => {
                this.currentDay = (this.currentDay - 1) < 0 ? 6 : this.currentDay - 1;
            }
            this.rightButton.onclick = () => {
                this.currentDay = (this.currentDay + 1) > 6 ? 0 : this.currentDay + 1;
            }
        }
    };
    WeeklyScheduleObj.addCallbacks();
    WeeklyScheduleObj.currentDay = 1;

}

function initializeSpecialHolidays() {

    SpecialHolidaysObj = {
        listContent: document.querySelector("section#special_holidays div.left-content div.list div.items"),
        slideButt: document.querySelector("section#special_holidays div.left-content div.list div.top div.slide-butt"),
        slideBar: document.querySelector("section#special_holidays div.left-content div.list div.top div.slide-butt div.slider"),
        _currentState: null,
        get currentState() {
            return this._currentState;
        },
        set currentState(arg) {
            if (arg === 1) {
                this.slideBar.style.left = '0';
                this.slideButt.classList = 'slide-butt one';
            } else if (arg === 2) {
                this.slideBar.style.left = '50%';
                this.slideButt.classList = 'slide-butt two';
            } else return;
            this.setContent(arg);
            this._currentState = arg;
        },
        setContent(arg) {
            document.querySelectorAll("section#special_holidays div.left-content div.list div.items div.item:not(.head), section#special_holidays div.left-content div.list div.items div.empty-div").forEach(x => x.remove())
            let result;
            if (arg === 1) {
                result = SpecialHolidaysUpcomingData; 
            } else if (arg === 2) {
                result = RecentHolidaysData; 
            } else return;

            if (result.length === 0) {
                this.listContent.innerHTML += `
                    <div class="empty-div">
                        <img src="/images/home/empty-date-list.png">
                    </div>
                    `;
            } else {
                for (let x of result) {
                    this.listContent.innerHTML += `
                    <div class="item">
                        <span>${x.date}</span>
                        <span>${x.slots}</span>
                        <span><i class="bi bi-trash" onclick="deleteHoliday(this, '${x.date}')"></i></span>
                    </div>
                    `;
                }
            }


        },

        addCallbacks() {
            this.slideButt.onclick = () => {
                this.currentState = this.currentState === 1 ? 2 : 1;
            }
        }
    };

    SpecialHolidaysObj.addCallbacks();
    SpecialHolidaysObj.currentState = 1;

}

async function deleteHoliday(self, date) {
    try {
        if (SpecialHolidaysObj.currentState === 1) {
            console.log(self, date);
            await sendReqForDeletingHoliday();
            self.parentElement.parentElement.remove();
            
            // Remove from data
            if (SpecialHolidaysUpcomingData.length !== 0) {
                for (let x in SpecialHolidaysUpcomingData) {
                    if (SpecialHolidaysUpcomingData[x].date === date) {
                        SpecialHolidaysUpcomingData.splice(x, 1);
                    }
                }
            }
            checkIfHolidayListIsEmpty();
        }
    } catch(err) {
        console.log(err);
        alert("Something went wrong! try refreshing the page.")
    }
}

async function sendReqForDeletingHoliday(date) {
    return new Promise(function (resolve, reject) {

        const requestObj = new XMLHttpRequest()
        requestObj.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) resolve();
            if (this.readyState == 4 && this.status == 400) reject();
        }
    
        requestObj.open("POST", `/home/my-organizations/${org_name.toLowerCase()}/delete-holiday`)
        const formdata = new FormData()
        formdata.append('date', date)
        requestObj.send(formdata)
    })
}

function checkIfHolidayListIsEmpty() {
    const items = Array.from(document.querySelectorAll("section#special_holidays div.left-content div.list div.items div.item"));
    console.log(items);
    if (items.length === 1) {
        document.querySelector("section#special_holidays div.left-content div.list div.items").innerHTML += `
        <div class="empty-div">
            <img src="/images/home/empty-date-list.png">
        </div>
        `;
    }
}