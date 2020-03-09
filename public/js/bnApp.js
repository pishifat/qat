$(function() {
    $('#loading').hide();
    $('#main').attr('style', 'visibility: visible');
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });

    $('#apply').click(async function() {
        $('#apply').attr('disabled', true);
        $('#confirm').text('');
        $('#errors').text('');
        const mode = $('input[name=mode]:checked').val();
        let mods = [];
        let reasons = [];
        // eslint-disable-next-line no-useless-escape
        const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

        for (let i = 0; i < 4; i++) {
            let mod = $(`#mod${i}`).val().trim();

            if (mod.indexOf('https://osu.ppy.sh/beatmapsets/') == 0 && regexp.test(mod)) {
                mods.push(mod);
                let reason = $(`#reason${i}`).val().trim();

                if (reason) {
                    reasons.push(reason);
                }
            }
        }

        if (!mode) {
            $('#errors').text('You must select a gamemode!');
        } else if (mods.length < 2) {
            $('#errors').text('You must enter at least two mods!');
        } else if (reasons.length < mods.length) {
            $('#errors').text('You must enter their reasons!');
        } else {
            $('#submitting').text(`Submitting & calculating mod score... (this will take a few seconds)`);

            try {
                const res = await axios.post(`/bnapps/apply`, { mode, mods, reasons });

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
