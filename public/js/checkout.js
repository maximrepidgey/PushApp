// A reference to Stripe.js
var stripe;

function initStripe() {
    // Disable the button until we have Stripe set up on the page
    document.querySelector("button").disabled = true;

    fetch("/checkout/create-payment-intent", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
    })
        .then(function (result) {
            return result.json();
        })
        .then(function (data) {
            return setupElements(data);
        })
        .then(function ({stripe, card, clientSecret}) {
            document.querySelector("button").disabled = false;

            // Handle form submission.
            var form = document.getElementById("payment-form");
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                // Initiate payment when the submit button is clicked
                pay(stripe, card, clientSecret);
            });
        });
}

// Set up Stripe.js and Elements to use in checkout form
var setupElements = function (data) {
    stripe = Stripe(data.publishableKey);
    var elements = stripe.elements();
    var style = {
        base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "#aab7c4"
            }
        },
        invalid: {
            color: "#fa755a",
            iconColor: "#fa755a"
        }
    };

    var card = elements.create("card", {style: style});
    card.mount("#card-element");
    const formatter = new Intl.NumberFormat(data.locale, {
        style: 'currency',
        currency: data.currency.toUpperCase(),
        minimumFractionDigits: 2
    });
    document.querySelector("#button-text").innerHTML += " " + formatter.format(data.amount / 100);

    return {
        stripe: stripe,
        card: card,
        clientSecret: data.clientSecret
    };
};

/*
 * Calls stripe.confirmCardPayment which creates a pop-up modal to
 * prompt the user to enter extra authentication details without leaving the payment page
 */
var pay = function (stripe, card, clientSecret) {
    changeLoadingState(true);

    // Initiate the payment.
    // If authentication is required, confirmCardPayment will automatically display a modal
    stripe
        .confirmCardPayment(clientSecret, {
            payment_method: {
                card: card
            }
        })
        .then(function (result) {
            if (result.error) {
                // Show error to your customer
                showError(result.error.message);
            } else {
                // The payment has been processed!
                orderComplete(clientSecret);
            }
        });
};

/* ------- Post-payment helpers ------- */
async function orderComplete(clientSecret) {
    try {
        let result = await stripe.retrievePaymentIntent(clientSecret);
        let paymentIntent = await result.paymentIntent;
        let paymentIntentJson = JSON.stringify(paymentIntent, null, 2);
        let _userAccountInfo = await fetch("/auth/getuserinfo");
        let user = await _userAccountInfo.json();
        let service = await fetch("/coaches/services/" + orderData.serviceId, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        service = await service.json();

        let transaction = {
            "_stripeId": paymentIntent.id,
            "amount": paymentIntent.amount / 100,
            "currency": paymentIntent.currency,
            "description": paymentIntent.description,
            "status": paymentIntent.status,
            "_userId": user.userAccountId,
            "_coachId": service[0]._coachId,
            "duration": service[0].duration,
            "stripeTimestamp": parseInt(paymentIntent.created)
        };
        let savedTransaction = await fetch("/checkout/register-transaction", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        });

        document.querySelector(".sr-payment-form").classList.add("hidden");
        if (savedTransaction.status === 200) {

            document.querySelector("pre").textContent = "Transaction successful. Thank you!";
            // document.querySelector("pre").textContent = paymentIntentJson;

            document.querySelector(".sr-result").classList.remove("hidden");
            setTimeout(function () {
                document.querySelector(".sr-result").classList.add("expand");
            }, 200);

            changeLoadingState(false);
        } else {
            // document.querySelector("pre").textContent = paymentIntentJson;
        }
    } catch (err) {
        console.log(err);
    }

};

var showError = function (errorMsgText) {
    changeLoadingState(false);
    var errorMsg = document.querySelector(".sr-field-error");
    errorMsg.textContent = errorMsgText;
    setTimeout(function () {
        errorMsg.textContent = "";
    }, 4000);
};

// Show a spinner on payment submission
var changeLoadingState = function (isLoading) {
    if (isLoading) {
        document.querySelector("button").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
    } else {
        document.querySelector("button").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
    }
};
