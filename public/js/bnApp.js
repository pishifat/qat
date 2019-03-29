$(function() {
    $('#loading').hide();
    $('#main').attr('style', 'visibility: visible');
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });


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
            $('#submitting').text(`Submitting... (this can take a few seconds)`);
            try {
                const res = await axios.post(`/nat/bnapps/apply`, { mode: mode, mods: mods });
                // temporary while test doesnt exist
                if (res.data.error) {
                    $('#errors').text(res.data.error);
                } else {
                    $('#applyBlock').hide();
                    $('#startTest').html(`<a href="/nat/testsubmission" class="btn btn-lg btn-nat" type="submit">Begin Ranking Criteria Test</a>
                        <p class="small pt-2 confirm">Your application has been submitted!</p>
                        <p class="small">Before your application can be reviewed, you must take a short test.</p>`);
                }
            } catch (error) {
                console.log(error);
                $('#errors').text('Something went wrong');
            }
        }

        $('#submitting').text(``);
        $('#apply').attr('disabled', false);
    });
});
