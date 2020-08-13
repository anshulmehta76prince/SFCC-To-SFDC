jQuery(document).ready(function ($) {
    main($);
    $('body').css('display', 'block');
});

function main($) {

    $.LoadingOverlaySetup({
        background: "rgba(255, 255, 255, 0.8)",
        image: $('#main-pane').data('img'),
        minSize: 10,
        maxSize: 80,
        imageAnimation: ''
    });

    initEvents($);
}

function initEvents($) {

    initTooltips($);


    $('#main-pane').on('click', '#submit-btn', function (e) {
        e.preventDefault();
        console.log('submit-btn click enter');

        var $form = $('#settings-form');
        // console.log($('#settings-form').serialize());
        saveFormData($, $form);

    });
}

function initTooltips($) {
    $('#main-pane').tooltip();
}

function saveFormData($, $form) {

    $("body").LoadingOverlay("show");
    var url = $form.data('url');
    console.log(url);
    formData = {};

    var LOGIN_URL = $('#login-url').val();
    var CLIENT_ID = $('#client_id').val();
    var CLIENT_SECRET = $('#client_secret').val();
    var USERNAME = $('#username').val();
    var PASSWORD = $('#user-password').val()+''+$('#security-token').val();
    var RESTSERVICE = $('#apex-rest').val();


    formData = {
        "LOGIN_URL": LOGIN_URL,
        "CLIENT_ID": CLIENT_ID,
        "CLIENT_SECRET": CLIENT_SECRET,
        "USERNAME": USERNAME,
        "PASSWORD": PASSWORD,
        "RESTSERVICE": RESTSERVICE
    }
    console.log(formData);

    var success = function () {
        console.log('Resolve');
        $('#msg').text('');
        $('#msg').removeAttr('title');
        $('#msg').css('color', '#049504');
        $('#msg').text('Orders Invoice created to SFDC successfully.');


        setTimeout(function () {
            $('#msg').text('');
        }, 5000);

        $( "#main-pane" ).load(window.location.href + " #main-pane" );
        $("body").LoadingOverlay("hide");
        
    };
    var fail = function () {
        console.log('Resolve');
        $('#msg').text('');
        $('#msg').removeAttr('title');
        $('#msg').css('color', '#049504');
        $('#msg').text('Creation of Orders Invoice to SFDC Failed.');


        setTimeout(function () {
            $('#msg').text('');
        }, 5000);

        $( "#main-pane" ).load(window.location.href + " #main-pane" );
        $("body").LoadingOverlay("hide");
        
    };


    var promise = new Promise(function (success, fail) {
        $.ajax({
                type: 'POST',
                url: url,
                data: formData
            })
            .done(function (data) {
                console.log(data);
                console.log(data.success);
                if (data.success) {
                    console.log('Here');
                    success();
                } else {
                    console.log('Fail');
                    fail();
                }
            });
    });

    promise.then(success, fail);
}
