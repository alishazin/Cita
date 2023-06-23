
var WeeklyScheduleObj = {};

function onLoad() {
    document.querySelector("nav a.item:nth-of-type(2)").classList += " active";
    initializeWeeklySchedule();
}

function initializeWeeklySchedule() {

    console.log(weeklyScheduleData);
    WeeklyScheduleObj = {
        tableDiv: document.querySelector('section#weekly_schedule div.table'),
        leftButton: document.querySelector('section#weekly_schedule div.top-row i.left'),
        rightButton: document.querySelector('section#weekly_schedule div.top-row i.right'),
        dayText: document.querySelector('section#weekly_schedule div.top-row div.box'),
        _currentDay: 0,
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
                for (let x of weeklyScheduleData[arg]) {
                    this.tableDiv.innerHTML += `
                    <div class="row">
                        <span>${x[0][0]}:${x[0][1] == 0 ? "00" : x[0][1]}</span>
                        <span>${x[1][0]}:${x[1][1] == 0 ? "00" : x[1][1]}</span>
                        <span>${x[2]}</span>
                        <span>${x[3]}</span>
                    </div>
                    `;
                }
            } else {
                this.tableDiv.innerHTML += `
                <div class="empty-div">
                    <img src="/images/home/empty-schedule.webp">
                    <span class="mt-3">Schedule looks empty.</span>
                </div>
                `;
            }
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
    WeeklyScheduleObj.setContent(0);

}