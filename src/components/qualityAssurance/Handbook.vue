<template>
    <section class="card card-body">
        <a data-bs-toggle="collapse" href="#howToUse">Quality Assurance handbook (aka: how do I use this page?) <i class="fas fa-angle-down" /></a>

        <div id="howToUse" class="collapse mt-4 mx-4">
            <p>
                What is this page for?
            </p>
            <p class="small ms-4">
                The "Quality Assurance" system aims to ensure beatmaps with unrankable issues do not reach the ranked section.
            </p>
            <p class="small ms-4">
                This involves full BN and NAT members reviewing qualified maps for large potential issues, usually not involving extensive modding as would be done while the beatmap is pending. Checking beatmaps through the QAH system does not count towards a BN's nomination activity.
            </p>
            <p>
                How do I participate?
            </p>
            <p class="small ms-4">
                Any BN who is not on probation or NAT member may contribute by clicking on the buttons on the right side of any beatmap card. The
                <i class="fas fa-plus text-success" />
                button should be used when you've checked a beatmap, including when you post issues on the map discussion page! The
                <i class="fas fa-minus text-danger" />
                button can be used if you accidentally mark the wrong beatmap.
            </p>
            <p class="small ms-4">
                You can also leave comments under any beatmap by clicking the <a href="#" @click.prevent><i class="fas fa-edit" /></a> button. If you post on a map's discussion, write what problems you found. While a map is still available to be checked, comments will be displayed anonymously.
            </p>
            <p>
                What are the rules for adding myself to a card?
            </p>
            <p class="small ms-4">
                You can only mark yourself as a QA checker for beatmaps that you did not participate in or nominate. The purpose of this system is to ensure that all beatmaps are thoroughly checked, and if you nominated a beatmap or created it yourself, you (hopefully) believe the beatmap has no problems already!
            </p>
            <p class="small ms-4">
                You should only mark yourself as a QA checker on beatmaps in modes you are qualified for. For example, if you're not an osu!taiko BN, don't mark yourself on any osu!taiko beatmaps.
            </p>
            <p class="small ms-4">
                You should mark yourself as a QA checker regardless of whether or not you post issues on the beatmap's thread.
            </p>
            <p>
                What else is there to know?
            </p>
            <p class="small ms-4">
                As part of the transition from Trello to this website, the first QA check on every beatmap is intended to be anonymous. This is to avoid users piggybacking on other users with the assumption that they already checked the beatmap thoroughly. That said, ONLY mark beatmaps that you've checked. If you're marking yourself as a QA checker to see which other user(s) have checked the beatmap, you're doing it wrong and you'll likely be told to stop using the QA system.
            </p>
            <p class="small ms-4">
                Additionally, beatmaps that meet any of the following conditions will appear transparent on the listing below, and will not be edit-able.
            </p>
            <ul class="small">
                <li>beatmaps that are ranked</li>
                <li>beatmaps that are disqualified</li>
                <li>beatmaps that have reached enough QA checks (2 per mode)</li>
            </ul>
            <p class="small ms-4">
                If a beatmap is re-qualified after a disqualification, it will have two entries on the listing: one from the first qualification, and one from the second. The first will not be edit-able, while the second will be. We recommend checking re-qualified beatmaps again, since issues could have arisen while the beatmap was being updated!
            </p>
            <p class="small ms-4">
                The due date on every beatmap card indicates 7 days from its most recent qualification. Re-qualified beatmaps may have editing access disabled before their actual due date because of rolling DQ timers.
            </p>
        </div>
    </section>
</template>

<script>
export default {
    name: 'Handbook',
};
</script>
