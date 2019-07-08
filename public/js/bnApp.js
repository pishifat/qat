function calculateMonthScore(modCount, modeValue) {
    if (!modCount) modCount = 0;
    return Math.log(1 + modCount) / Math.log(Math.sqrt(1 + modeValue)) - (2 * (1 + modeValue)) / (1 + modCount);
}

$(function() {
    $('#loading').hide();
    $('#main').attr('style', 'visibility: visible');
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });
    
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
        $('#calcWait').text('Retrieving info... (this will take a few seconds)');
        const res = await axios.get(`/bnapps/mods`);
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

    $('#apply').click(async function() {
        $('#apply').attr('disabled', true);
        $('#confirm').text('');
        $('#errors').text('');
        const mode = $('input[name=mode]:checked').val();
        let mods = [];
        const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        for (let i = 0; i < 4; i++) {
            let mod = $(`#mod${i}`).val().trim();
            if (mod.indexOf('https://osu.ppy.sh/beatmapsets/') == 0 && regexp.test(mod)) {
                mods.push(mod);
            }
        }
        if (!mode) {
            $('#errors').text('You must select a gamemode!');
        } else if (mods.length < 2) {
            $('#errors').text('You must enter at least two mods!');
        } else {
            $('#submitting').text(`Submitting & calculating mod score... (this will take a few seconds)`);
            try {
                const res = await axios.post(`/bnapps/apply`, { mode: mode, mods: mods });
                if (res.data.error) {
                    $('#errors').text(res.data.error);
                } else {
                    $('#applyBlock').hide();
                    $('#startTest').html(`<a href="/testsubmission" class="btn btn-lg btn-nat">Begin Ranking Criteria Test</a>
                        <p class="small pt-2 confirm">Your application has been submitted!</p>
                        <p class="small">Before your application can be reviewed, you must take a short test.</p>`);
                }
            } catch (error) {
                $('#errors').text('Something went wrong');
            }
        }

        $('#submitting').text(``);
        $('#apply').attr('disabled', false);
    });
});
