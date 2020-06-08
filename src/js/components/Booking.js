/* eslint-disable linebreak-style */
/* eslint-disable indent */

import { templates, select, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element) {
        const thisBooking = this;

        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData() {
        const thisBooking = this;

        const startDateparam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const dateEndDateparam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateparam,
                dateEndDateparam,
            ],
            eventCurrent: [
                settings.db.notRepeatParam,
                startDateparam,
                dateEndDateparam,
            ],
            eventRepeat: [
                settings.db.repeatParam,
                dateEndDateparam,
            ],
        };

        const urls = {
            booking: settings.db.url + '/' + settings.db.booking
                + '?' + params.booking.join('&'),
            eventCurrent: settings.db.url + '/' + settings.db.event
                + '?' + params.eventCurrent.join('&'),
            eventRepeat: settings.db.url + '/' + settings.db.event
                + '?' + params.eventRepeat.join('&'),
        };

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventCurrent),
            fetch(urls.eventRepeat),
        ])
            .then(function (allResponse) {
                const bookingsResponse = allResponse[0];
                const eventsCurrentResponse = allResponse[1];
                const eventsRepeatResponse = allResponse[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;

        thisBooking.booked = {};


        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
            // console.log(item.table);
        }

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                const itemDateParse = new Date(item.date);
                for (let loopDate = itemDateParse; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        thisBooking.updateDOM();
    }
    makeBooked(date, hour, duration, tables) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {

            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }
            for (let table of tables) {
                thisBooking.booked[date][hourBlock].push(table);
            }
        }
    }
    updateDOM() {
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if (
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }
            if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
                table.classList.add(classNames.booking.tableBooked);
            }
            else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    tableReservation() {
        const thisBooking = this;

        thisBooking.tableNumber = [];

        for (let table of thisBooking.dom.tables) {
            table.addEventListener('click', function (event) {
                event.preventDefault();
                if (table.classList.contains(classNames.booking.tableBooked)) {
                    document.querySelector(select.booking.modalMsg).style.display = 'block';

                    document.querySelector('.closeBtn').addEventListener('click', function () {
                        document.querySelector(select.booking.modalMsg).style.display = 'none';
                        thisBooking.tableNumber = [];
                        thisBooking.updateDOM();
                    });
                } else {
                    table.classList.add(classNames.booking.tableBooked);
                    thisBooking.bookedTable = event.target;
                    thisBooking.chosenTable = thisBooking.bookedTable.getAttribute(settings.booking.tableIdAttribute);
                    thisBooking.tableNumber.push(thisBooking.chosenTable);
                    // if (thisBooking.tableNumber.length > 1) {
                    //     thisBooking.removeTableNumber = thisBooking.tableNumber[0];
                    //         thisBooking.tableNumber.shift();
                    //     }

                    console.log(thisBooking.tableNumber);
                }
            });
        }



        thisBooking.dom.submit.addEventListener('click', function (event) {
            event.preventDefault();
            thisBooking.sendBooking();
        });
    }

    render(element) {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();

        thisBooking.dom = [];
        thisBooking.dom.wrapper = element;

        thisBooking.dom.wrapper = utils.createDOMFromHTML(generatedHTML);

        const bookingWrapper = document.querySelector(select.containerOf.booking);
        bookingWrapper.appendChild(thisBooking.dom.wrapper);

        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(settings.booking.starters);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.email = thisBooking.dom.wrapper.querySelector(select.booking.email);
        thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(select.booking.formSubmit);
        //thisBooking.dom.popupModal = thisBooking.dom.wrapper.querySelector(select.booking.modalMsg);
    }

    initWidgets() {
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
        });

        thisBooking.tableReservation();
    }

    sendBooking() {
        const thisBooking = this;
        const url = settings.db.url + '/' + settings.db.booking;

        const payload = {
            table: thisBooking.tableNumber,
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            duration: thisBooking.hoursAmount.value,
            ppl: thisBooking.peopleAmount.value,
            phone: thisBooking.dom.phone.value,
            email: thisBooking.dom.email.value,
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        fetch(url, options)
            .then(function (response) {
                return response.json();
            }).then(function (parsedResponse) {
                console.log('parsedResponse', parsedResponse);
            });
    }

}

export default Booking;