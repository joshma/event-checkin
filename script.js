// Change this to your URL!
var ATTENDEE_SAVE_URL = 'submit.php';

var get_athena = function() {
    // "Parses" out the athena username by combining all letter elements.
    var athena = "";
    $('#cool-textbox').children().not('.match').each(function(i, el) {
        athena += $(el).html();
    });
    return athena;
}

// No-op function by default, setup_printer will set up proper callback.
var print_func = function() {}

// POSTs email and name to SUBMIT_URL.
var confirm_attendee = function() {
    var email = $('body').data('email');
    // Use form value if they changed it.
    var name = $('#form-name').val();
    $.post(ATTENDEE_SAVE_URL, {
        email: email,
        name: name
    }, print_func);
};

// Updates HTML with athena substring matches.
// Takes as input the div of matches to append to.
var update_matches = function(match) {
    var athena = get_athena();
    match.html('');
    if (athena.length < 2) {
      return;
    }
    var list = athenas[athena[0]];
    var html = "";
    var matches = 0;
    for (var i = 0; i < list.length; i++) {
        var v = list[i];
        if (v.indexOf(athena) === 0) {
            if (matches == 0) {
                html += '<span class="first-line">' + v.substr(athena.length) + '</span>';
            } else {
                html += v.substr(athena.length);
            }
            html += "<br />";
            matches++;
            if (matches == 4) {
                break;
            }
        }
    }
    match.html(html);
}

// True if user has hit enter and is confirming details.
var submitting = false;

// Clear everything.
var reset = function() {
    $('.blinker').show();
    $('#cool-textbox').children().not('.match, .blinker').remove();
    $('.match').html('');
    $('form').addClass('fade-out');
}

// Brings up confirmation form.
var submit = function() {
    submitting = true;
    var athena = get_athena() + $('.first-line').html();
    $('#loading').removeClass('hide');
    $('.match').addClass('disabled');

    // Get athena - index.php serves double-duty to ldaps.
    $.post('', { email: athena }, function(res) {
        $('#loading').addClass('hide');
        $('.match').removeClass('disabled');
        reset();
        var student = JSON.parse(res);
        console.log(student);

        $('#form-name').val(student.name);
        var years = {
            "1": "FRESHMAN",
            "2": "SOPHOMORE",
            "3": "JUNIOR",
            "4": "SENIOR"
        };
        $('body').data('email', athena);
        if (student.year in years) {
            $('#form-year').val(years[student.year]);
        } else {
            $('#form-year').val("year " + student.year);
        }
        $('#form-course').val(student.course);
        $('form').removeClass('fade-out');
        $('#form-name').focus();
    })
    .error(function(res) {
        $('#loading').addClass('hide');
        $('.match').removeClass('disabled');

        var error = $('<div class="submit-result error fade-out">invalid athena</div>');
        $('body').append(error);
        setTimeout(function() {
            error.removeClass('fade-out');
        }, 10);
        setTimeout(function() {
            var b = $('.submit-result');
            b.addClass('fade-out');
            setTimeout(function() {
                b.remove();
            }, 500);
        }, 2000);

        submitting = false;
    });
}

// Set up basic textbox with event listeners.
var setup_textbox = function() {
    var c = $('#cool-textbox');
    var match = $('<span class="match visible">');
    c.append(match);
    var blinker = $('<div class="blinker">');
    c.append(blinker);
    $(document).on('keypress', function(e) {
        console.log(e.which);
        if (e.which == 13) {
            if (submitting) {
                confirm_attendee();
                $('form').addClass('fade-out');
                submitting = false;
            } else {
                submit();
            }
            return;
        }
        // Some gross handling for special keys.
        if (e.which == 8) {
            return;
        }
        // Ignore keypresses here if submitting confirmation.
        if (submitting) {
            return;
        }
        if (e.which == 32) {
            reset();
            return;
        }
        $('.blinker').hide();
        var el = $('<span class="letter">').html(String.fromCharCode(e.which));
        var starting_left = (Math.random() * 50) - 50;
        var starting_top = (Math.random() * 50) - 50;
        el.css('left', starting_left);
        el.css('top', starting_top);
        match.before(el);
        setTimeout(function() {
            el.css('left', 0);
            el.css('top', 0);
            el.addClass('visible');
            update_matches(match);
        }, 50);
    });
    $(document).on('keydown', function(e) {
        // 27: ESC
        if (e.which == 27) {
            submitting = false;
            reset();
            return;
        }
        // 8: BACKSPACE
        if (e.which != 8) {
            return;
        }
        var r = match.prev();
        r.removeClass('visible');
        setTimeout(function() {
            r.remove();
            update_matches(c, match);
        }, 200);
        return (e.target.id.substring(0,5) === 'form-');
    });
}

// Sets up the DYMO printer to print out nametags.
var setup_printer = function(xml) {
    var label = dymo.label.framework.openLabelXml(xml);

    var printers = dymo.label.framework.getPrinters();
    if (printers.length == 0) {
        alert("No DYMO printers are installed!");
        return;
    }

    var printerName = printers[0].name;

    print_func = function() {
        label.setObjectText("name_ref", $("#form-name").val());
        label.setObjectText("major_ref", $("#form-course").val());
        label.setObjectText("year_ref", $("#form-year").val());
        label.print(printerName); 
    };
}

$(document).ready(function() {
    // Initialize textbox.
    setup_textbox();
    // Fetch label XML template.
    $.ajax({
        url: "/checkin/nametag.label",
        dataType: "text",
        success: function(xml) {
            setup_printer(xml);
        }
    });
});
