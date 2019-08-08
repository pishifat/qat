function calculateMonthScore(modCount, modeValue) {
    if (!modCount) modCount = 0;
    return Math.log(1 + modCount) / Math.log(Math.sqrt(1 + modeValue)) - (2 * (1 + modeValue)) / (1 + modCount);
}

$(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });
    let to = new Date();

    for (let i = 1; i < 4; i++) {
        let from = to;
        to.setMonth(to.getMonth() - 1);
        $(`#modCount${i}`).attr('placeholder', `# mods from ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`);
    }
    
    $('.modCount').change(function() {
        let modeValue;
        if ($('input[name=mode]:checked').val()) {
            modeValue = $('input[name=mode]:checked').val() == 'osu' ? 4 : 3;
        } else {
            modeValue = 4;
        }
        let totalScore = 0;
        $('.modCount').each(function(k, e) {
            totalScore += calculateMonthScore(parseInt($(e).val()), modeValue);
        });
        totalScore = totalScore.toFixed(2);
        $('#totalScore').text(totalScore.toString());
    });

    $('#calculateScore').click(async function () {
        const userId = $('#userId').val().trim();
        if (!userId || userId == '') {
            $('#calcWait').text('You need to write your username or ID');
            return;
        }

        $('#calcWait').text('Retrieving info... (this will take a few seconds)');
        const res = await axios.get(`/bnapps/modsCount/${userId}`);
        $('#calcWait').text('');
        if (res.data.error) {
            $('#errors').text(res.data.error);
        } else {
            const modCount = res.data.modCount;
            $('#modCount1').val(modCount[0]);
            $('#modCount2').val(modCount[1]);
            $('#modCount3').val(modCount[2]).change(); // Triggers .change function above
        }
    });
});