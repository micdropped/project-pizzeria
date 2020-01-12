/* eslint-disable linebreak-style */
/* eslint-disable indent */

import { settings, select, templates, classNames } from '../settings.js';
import { utils } from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
    constructor(element) {
        // debugger;
        const thisCart = this;

        thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

        thisCart.products = [];

        thisCart.getElements(element);
        thisCart.initActions();

        // console.log('new Cart', thisCart);


    }

    getElements(element) {
        const thisCart = this;

        thisCart.dom = {};

        thisCart.dom.wrapper = element;
        thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
        thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
        thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
        thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
        thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);

        thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];

        for (let key of thisCart.renderTotalsKeys) {
            thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
        }
    }

    initActions() {
        const thisCart = this;

        thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
            event.preventDefault();
            thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        });

        thisCart.dom.productList.addEventListener('updated', function () {
            thisCart.update();
        });

        thisCart.dom.productList.addEventListener('remove', function (event) {
            thisCart.remove(event.detail.cartProduct);
        });

        thisCart.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisCart.sendOrder();
            console.log('submit');
        });
    }

    add(menuProduct) {
        const thisCart = this;

        const generatedHTML = templates.cartProduct(menuProduct);
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);

        thisCart.dom.productList.appendChild(generatedDOM);

        thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
        //console.log('thisCart.products', thisCart.products);
        thisCart.update();
    }

    update() {
        const thisCart = this;

        thisCart.totalNumber = 0;
        thisCart.subtotalPrice = 0;

        for (let product of thisCart.products) {
            thisCart.totalNumber += product.amount;
            thisCart.subtotalPrice += product.price;
        }

        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;

        for (let key of thisCart.renderTotalsKeys) {
            for (let elem of thisCart.dom[key]) {
                elem.innerHTML = thisCart[key];
            }
        }
    }
    remove(cartProduct) {
        const thisCart = this;
        const index = thisCart.products.indexOf(cartProduct);
        thisCart.products.splice(index, 1);
        cartProduct.dom.wrapper.remove();
        thisCart.update();
    }

    sendOrder() {
        const thisCart = this;
        const url = settings.db.url + '/' + settings.db.order;

        const payload = {
            number: 'order No:' + thisCart.totalNumber,
            address: thisCart.dom.address.value,
            phone: thisCart.dom.phone.value,
            subtotalPrice: thisCart.subtotalPrice,
            deliveryFee: thisCart.deliveryFee,
            totalPrice: thisCart.totalPrice,
            products: []
        };

        for (let product of thisCart.products) {
            payload.products.push(product.getData());
        }

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

export default Cart;