var data_en = {
    'instructions': "Enter yout mobile number",
    'instructions_pin': 'Enter the PIN Code received by SMS:',
    'choose': 'Choose your operator',
    "subscribe": 'Confirm!',
    "verify": 'Confirm!',
};

var data_ar = {
    'instructions': 'أدخل رقم هاتفك المحمول',
    'instructions_pin': 'أدخل رمز PIN الذي تلقيته عبر الرسائل القصيرة:',
    'choose': 'اختر المشغل الخاص بك',
    "subscribe": 'يتأكد!',
    "verify": 'يتأكد!', 
};

document.addEventListener("DOMContentLoaded", function () {

    const msisdnInput = $("#msisdn");
    const sendButton = $("#subscribe");   

    let lang = 'eng';
    let urlParams = new URLSearchParams(window.location.search);
    let urlLang = urlParams.get('l');
    if (urlLang === 'arb') {
        lang = 'arb';
    }

    window.msg_code_expired = 'Your code has expired, please try again.';
    window.msg_sent_code_validity = 'The new code was sent valid until: ';
    window.msg_wrong_number = 'Invalid phone number.';
    window.msg_number_error = 'Please check your phone number and try again';
    window.msg_wrong_pin_valide = 'Please check the code and try again';
    window.msg_wrong_pin = 'Wrong pin';
    window.msg_success_link ='Your subscription has been successfully completed!';
    window.msg_error_operator ='Mobile operator selected incorrectly';

    let handleError = function (obj) {
        if (obj != undefined && obj.error) {
            $('.mw_error_msg').html(
                '<div class="row" id="mw_error_msg' + '">'
                + '<div class="error">'
                + '<span>' + obj.message + '</span>'
                + '</div></div>'
            );
            $("#mw_pin_code").val('');
            return true;
        }
        $('.mw_error_msg').empty();
        return false;
    }

    let checkPinFormat = function (code, begin) {
        if (!begin && begin !== 0) begin = 4;
        let reg = new RegExp("^\\d{" + begin + ",4}$");
        return reg.test(code);
    }

    msisdnInput.on("input", function () {
        var phoneNumber = $(this).val();
        var maxLength = 9;
        if (phoneNumber.startsWith("+9710")) {
            maxLength = 14;
        } else if (phoneNumber.startsWith("+971")) {
            maxLength = 13;
        }
        else if (phoneNumber.startsWith("9710")) {
            maxLength = 13;
        } else if (phoneNumber.startsWith("971")) {
            maxLength = 12;
        } else if (phoneNumber.startsWith("0")) {
            maxLength = 10;
        }

        $(this).attr("maxlength", maxLength);

        if (phoneNumber.length === maxLength) {
            sendButton.prop("disabled", false).removeClass("btn-disable").addClass("btn-enable");
        } else {
            sendButton.prop("disabled", true).removeClass("btn-enable").addClass("btn-disable");
        }

    });

    function validPhone() {
        let phoneNumber = msisdnInput.val().replace(/[^0-9]/g, "");

        if (!phoneNumber.startsWith("971")) {
            phoneNumber = "971" + phoneNumber.replace(/^0/, "");
        } else if (phoneNumber.startsWith("9710")) {
            phoneNumber = "971" + phoneNumber.substring(4);
        }
        return phoneNumber;
    }

    // активная форма через клик на логотип
    let logoClick = document.querySelector('.logo');
    let formActive = document.querySelectorAll('.formWrap');
    logoClick.addEventListener('click',function() {
        formActive.forEach(element => {
            element.classList.add('shake-horizontal');
        });
    })

    sendButton.on("click", sendPhoneNumber);

    function sendPhoneNumber() {
        typeof hook3 === 'function' && hook3();
        let phoneNumber = validPhone();              
        let csrf_token = $('#csrf_token').val();
        let global_lang = lang.substring(0, 3).slice(0, -1);
        let loading = document.getElementById('button-loading');
        loading.style.display = 'inline-block';
        
        $.ajax({
            type: "POST",
            url: '../../functions_pinapi/msisdn.php',
            data: {
                "phone_number": phoneNumber,
                "search": location.search,
                "pathname": location.pathname,
                "csrf_token": csrf_token,
                "language": global_lang,
                "api": api_pub,
                "pid": get_url_parameter('pid'),
                "clickid": get_url_parameter('clickid'),
                "offer_id": get_url_parameter('offer_id'),
                "our_clickid": our_clickid,
                "operator":  "etisalat",
            },
            success: function (data) {
                const obj = JSON.parse(data);
                console.log(obj);
                if (obj.result == "success") {                    
                    $('#reqid').val(obj.message);
                    $(".form_msisdn").css('display', 'none');
                    $(".form_pin").css('display', 'block');
                    $("#mw_pin_code").val('');
                    $('.mw_error_msg').hide();
                    $('.f_error').hide();
                    loading.style.display = 'none';
                }else if (obj.result == "error") {                    
                    handleError({ error: true, message: window.msg_wrong_number});
                    loading.style.display = 'none';                  
                } 
                else {
                    $('.f_error').text(window.msg_number_error).show();
                    loading.style.display = 'none';
                }
            }
        });
    }

    let toggleSubmit = function (enable, hard) {
        if (enable) {
            $('.mw_form_submit')
                .removeClass("btn-disable")
                .addClass("btn-enable")
                .removeAttr("disabled");
            return;
        }
        $('.mw_form_submit')
            .addClass("btn-disable")
            .removeClass("btn-enable")
            .attr('disabled', 'disabled');
    }

    // обработка пинкода
    let handlePinKeypress = function (evt) {
        let theEvent = evt || window.event;
        handleError();
        // Handle paste
        let key = "";
        if (theEvent.type === 'paste') {
            key = event.clipboardData.getData('text/plain');
        } else {
            // Handle key press
            key = theEvent.keyCode || theEvent.which;
            key = String.fromCharCode(key);
        }
        let pinVal = $("#mw_pin_code").val();
        let position = $("#mw_pin_code").get(0).selectionStart;
        let code = pinVal.substring(0, position) + key + pinVal.substring(position);
        let checkFormat = checkPinFormat(code, 0)
        if (theEvent.keyCode !== undefined && theEvent.keyCode !== 8 && (!/[0-9]/.test(key) || !checkFormat)) {
            theEvent.returnValue = false;
            if (theEvent.preventDefault) theEvent.preventDefault();
        }
    };
    // обработка кнопки после ввода пинкода
    let handlePinKeyup = function () {
        toggleSubmit(checkPinFormat($("#mw_pin_code").val()));
    };

    let checkPinEnable = function () {
        return $('.form_pin').css('display') !== 'none';
    }

    $(document).on('click', '.mw_form_submit', function () {
        if (checkPinEnable() && !checkPinFormat($("#mw_pin_code").val())) {
            handleError({ error: true, message: window.msg_wrong_pin });
            return false;
        }
    });

    $("#verify").on("click", function (e) {
        typeof hook2 === 'function' && hook2();
        let phoneNumber = validPhone();
        let csrf_token = $('#csrf_token').val();
        let global_lang = lang.substring(0, 3).slice(0, -1);
        let loading = document.getElementById('button-loading');
        loading.style.display = 'inline-block';
        $.ajax({
            type: "POST",
            url: '../../functions_pinapi/pin.php',
            data: {
                "phone_number": phoneNumber,
                "reqid": $('#reqid').val(),
                "otp": $('#mw_pin_code').val(),
                "csrf_token": csrf_token,
                "language": global_lang,
                "api": api_pub,
                "pid": get_url_parameter('pid'),
                "offer_id": get_url_parameter('offer_id'),
                "gclid": get_url_parameter('gclid'),
                "gbraid": get_url_parameter('gbraid'),
                "wbraid": get_url_parameter('wbraid'),
                "operator":  "etisalat",
            },
            success: function (data) {
                const obj = JSON.parse(data);
                console.log(obj);
                if (obj.result == "success") {
                        $.get("../../functions_pinapi/check.php", {
                        "phone_number": phoneNumber,
                        "api": api_pub, 
                        "offer_id": get_url_parameter('offer_id'),
                        "operator":  "etisalat",
                    }).then(function (response) {
                        console.log(response);
                        if (response.trim() === "no link") {
                            $(".form_pin").css('display', 'none');  
                            $(".no_link").css('display', 'block');                          
                            $("#success_link").text(window.msg_success_link).show();
                            loading.style.display = 'none';
                        } else {                           
                            if (typeof hook1 === 'function') {
                            hook1(response);
                        } else {
                            window.location.href = response;
                        }
                        }
                    });
                    toggleSubmit(true);
                    $("#mw_pin_code").val('');
                } else if (obj.result == "error") {
                    handleError({ error: true, message: window.msg_wrong_pin });
                    loading.style.display = 'none';
                    $(".mw_error_msg").css('display', 'block');
                } else if (obj.result == "unknown_error") {
                    handleError({ error: true, message: window.msg_wrong_pin });
                    loading.style.display = 'none';
                } else {
                    $('.p_error').text(window.msg_wrong_pin_valide).show();
                    loading.style.display = 'none';
                }
            }
        });
        e.preventDefault();
        return false;
    });

    $("#mw_pin_code")
        .on("keypress", handlePinKeypress)
        .on("keyup", handlePinKeyup)
        .on("focus", handlePinKeyup);

    $('#exit_btn').on('click', function () {
        window.location.href = "https://google.com";
    });

    // извлекаем параметр из url-адреса
    function get_url_parameter(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    let languageLinks = document.querySelectorAll(".btn_links");
    languageLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            let bodyRtl = document.body;
            if (link.textContent === 'EN') {
                link.textContent = 'عربي';
                link.href = "?l=eng";
                bodyRtl.classList.remove("rtl-text");
            } else {
                link.textContent = 'EN';
                link.href = "?l=arb";
                bodyRtl.classList.add("rtl-text");
            }
            let newLang = this.getAttribute("href").replace("?l=", "");
            urlParams.set('l', newLang);
            let newUrl = window.location.pathname + '?' + urlParams.toString();

            window.history.pushState({}, '', newUrl);

            updateLanguage(newLang);
            updateFooterLanguage(newLang, api_pub);

        });
    });
});

function updateFooterLanguage(lang, api_pub) {
    let xhrFooter = new XMLHttpRequest();
    xhrFooter.onreadystatechange = function () {
        if (xhrFooter.readyState === 4) {
            if (xhrFooter.status === 200) {
                let response = xhrFooter.responseText;
                let footerData = JSON.parse(response);
                console.log(footerData);
                let footerFooter = '';
                let termsFooter = '';
                if (lang === 'eng') {
                    footerFooter = footerData.footer.en;
                    termsFooter = footerData.terms.en;
                } else if (lang === 'arb') {
                    footerFooter = footerData.footer.ar;
                    termsFooter = footerData.terms.ar;
                }
                document.getElementById('footer_text').innerHTML = footerFooter;
                document.getElementById('terms').innerHTML = termsFooter;
            } else {
                console.error('Ошибка: ', xhrFooter.status, xhrFooter.statusText);
            }
        }
    };
    xhrFooter.open('GET', '../../functions_pinapi/footer.php?api_name=' + api_pub, true);
    xhrFooter.send();
}
