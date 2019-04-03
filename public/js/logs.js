$(function () {
    $('#loading').hide();
    $('#main, footer').attr('style', 'visibility: visible');
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });

    let skip = 100;

    $('#showMore').click(function () {
        $('#showMore').prop("disabled", true);
        $.getJSON(`/nat/logs/more/${skip}`).done(function (logs) {
            skip += 100;
            $('#showMore').prop("disabled", false);

            $.each(logs, function (k, log) {
                $(`<tr>
                    <td scope="row">${new Date(log.createdAt).toString().slice(4,24)} GMT</td>
                    <td scope="row">${log.user.username}</td>
                    <td scope="row">${log.action.length > 120 ? log.action.slice(0,120) + "..." : log.action}</td>
                </tr>`).hide().appendTo('tbody').fadeIn();
            });
        });
    });
});
