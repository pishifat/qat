$(function () {
    $('#loading').hide();
    $('#main').attr('style', 'visibility: visible');
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });

    let skip = 100;

    $('#showMore').click(function () {
        $('#showMore').prop('disabled', true);
        $.getJSON(`/logs/more/${skip}`).done(function (logs) {
            skip += 100;
            $('#showMore').prop('disabled', false);

            $.each(logs, function (k, log) {
                $(`<tr>
                    <td scope="row">${new Date(log.createdAt).toString().slice(4,24)} GMT</td>
                    <td scope="row">${log.user.username}</td>
                    <td scope="row">${log.action.length > 90 ? log.action.slice(0,90) + '...' : log.action}</td>
                </tr>`).hide().appendTo('tbody').fadeIn();
            });
        });
    });

    $('#showErrors').click(function () {
        $.getJSON(`/logs/showErrors`).done(function (logs) {
            $.each(logs, function (k, log) {
                $(`<tr>
                    <td scope="row">${new Date(log.createdAt).toString().slice(4,24)} GMT</td>
                    <td scope="row">~</td>
                    <td scope="row">${log.action}</td>
                </tr>`).hide().prependTo('tbody').fadeIn();
            });
        });
    });
});
