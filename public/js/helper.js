function setFooterPosition() {
    let screenLimit = window.innerHeight - 83;
    if (screenLimit < $('#main').outerHeight(true)) {
        $('footer').css('position', 'inherit');
    } else {
        $('footer').css('position', 'fixed');
    }
}

$(function () {
    setFooterPosition();
    
    $(window).resize(function() {
        setFooterPosition();
    });

    // Don't like this but eh
    let mainHeight = $('#main').outerHeight(true);
    setInterval(() => {
        if (mainHeight != $('#main').outerHeight(true)) {
            setFooterPosition();
        }
    }, 1000);

});