$(function() {
    $('#loading').hide();
    $('#main').attr('style', 'visibility: visible');

    $('#report').click(async function() {
        $('#report').attr('disabled', true);
        $('#confirm').text('');
        $('#errors').text('');

        let username = $('#username').val();
        let reason = $('#reason').val();
        if(!username.length || !reason.length){
            $('#errors').text('Cannot leave fields blank!');
        }else{
            try {
                const res = await axios.post(`/qat/reports/submitReport`, { username: username, reason: reason });
                if (res.data.error) {
                    $('#errors').text(res.data.error);
                } else {
                    $('#confirm').text(
                        'Your report has been submitted! Its outcome will be sent to you via osu! forum PM.'
                    );
                }
            } catch (error) {
                console.log(error);
                $('#errors').text('Something went wrong');
            }
        }
        $('#report').attr('disabled', false);
    });
});
