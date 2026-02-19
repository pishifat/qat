<template>
    <section class="card card-body">
        <a data-bs-toggle="collapse" href="#howToUse">How to evaluate applicants <i class="fas fa-angle-down" /></a>

        <div id="howToUse" class="collapse mt-4 mx-2">
            <p><b>Modding</b></p>
            <p class="small ms-4">
                The following are modding traits expected of Beatmap Nominators. Their mods should demonstrate most, if not all of them
            </p>
            <ul class="small ms-2">
                <li>Coverage of all common difficulty levels.</li>
                <li>Identification of unrankable issues, including ones tools cannot detect, such as incorrect timing or metadata.</li>
                <li>Comparisons of parts of a map to support issues/suggestions.</li>
                <li>Commentary about a wide variety of beatmap elements, such as rhythm, spacing, movement, intensity, contrast, and consistency.</li>
                <li>Identification of both isolated issues and general map-wide issues.</li>
                <li>Consideration of mappers' intentions when identifying issues and giving suggestions.</li>
                <li>Ability to make useful suggestions and spot mistakes for mappers of varying experience levels.</li>
                <li>Clear communication with the mapper.</li>
            </ul>
            <p class="small ms-4">
                A more detailed explanation if the above can be found in
                <a href="https://osu.ppy.sh/wiki/en/People/Beatmap_Nominators/Becoming_a_Beatmap_Nominator#modding-expectations" target="_blank">this page</a>.
            </p>
            <p class="small ms-4">
                To effectively evaluate an applicant's mods, you will likely need to download the beatmap and examine it yourself. This can reveal if the applicant's suggestions fit appropriately with the beatmap and if the applicant overlooks any of the beatmap's glaring problems! When criticizing a specific mod post, include a link to it alongside your explanation.
            </p>
            <p class="small ms-4">
                Mod posts with beneficial suggestions are valuable regardless of their writing style. Verbose writing may not be helpful despite explanations being detailed. Regardless of writing style, the content of the suggestions is what matters. A poor writing style can be fixed much more practically than poor modding knowledge, so don't consider it too vital to an applicant's capabiltiies.
            </p>
            <p class="small ms-4">
                While there's no correct way to write a modding evaluation, we recommend writing anything noteworthy about their mods on each map, then a conclusive sentence or two explaining your voting decision.
            </p>

            <p><b>Behavior</b></p>
            <p class="small ms-4">
                Behavior is worth commenting on when an applicant is known to consistently cause problems within the mapping/modding community. Links to instances of poor behavior are appreciated when relevant. Behavior more than 3 months ago should only be considered for repeat offenders.
            </p>
            <p class="small ms-4">
                Sloppy or rudely written mod posts are usually not worth addressing. Consider whether the beatmap's creator is a friend of the modder to understand reasons behind their behavior.
            </p>
            <p class="small ms-4">
                If you don't know anything about a user, their behavior is likely not worth mentioning. Feel free to write a comment like "fine" in these cases.
            </p>
        </div>
    </section>
</template>

<script>
export default {
    name: 'EvaluationInstructions',
};
</script>
