/* eslint-disable linebreak-style */
/* eslint-disable indent */

import { select, settings } from '../settings.js';

class AmountWidget {
    constructor(element) {
        const thisWidget = this;


        thisWidget.getElements(element);
        thisWidget.setValue(thisWidget.input.value);
        thisWidget.initActions();

        // console.log(thisWidget.value);
        // console.log('AmountWidget: ', thisWidget);
        // console.log('constructor arguments: ', element);
    }

    getElements(element) {
        const thisWidget = this;

        thisWidget.element = element;
        thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
        thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
        thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);

    }

    setValue(value) {
        const thisWidget = this;
        thisWidget.value = settings.amountWidget.defaultValue;
        // console.log(thisWidget);
        let newValue = parseInt(value);

        /*  TODO: Add validation */
        if (newValue !== thisWidget.value
            && newValue <= settings.amountWidget.defaultMax
            && newValue >= settings.amountWidget.defaultMin) {
            thisWidget.value = newValue;
            thisWidget.announce();
            //console.log(newValue);
        }
    }

    initActions() {
        const thisWidget = this;

        thisWidget.input.addEventListener('change', function () {
            thisWidget.setValue(thisWidget.input.value);
        });

        thisWidget.linkDecrease.addEventListener('click', function (event) {
            event.preventDefault();
            thisWidget.setValue(thisWidget.value - 1);
        });

        thisWidget.linkIncrease.addEventListener('click', function (event) {
            event.preventDefault();
            thisWidget.setValue(thisWidget.value + 1);
        });



    }

    announce() {
        const thisWidget = this;

        const event = new CustomEvent('updated', { bubbles: true });
        thisWidget.element.dispatchEvent(event);
    }

}

export default AmountWidget;