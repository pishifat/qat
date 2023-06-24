<template>
    <div
        v-cloak
        id="app"
    >
        <header v-if="loggedInUser">
            <nav
                id="top"
                class="navbar navbar-expand-lg navbar-dark navbar-nat"
            >
                <button
                    class="navbar-toggler"
                    type="button"
                    data-toggle="collapse"
                    data-target="#navbar"
                >
                    <span class="navbar-toggler-icon" />
                </button>

                <div id="navbar" class="collapse navbar-collapse justify-content-center">
                    <ul class="navbar-nav">
                        <!-- this is going to be very repetitive and i don't care. optimizing makes organization a pain -->

                        <!-- everyone -->
                        <li class="nav-item">
                                <router-link class="nav-link" to="/home">
                                    Home
                                </router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/bnapps">
                                    BN Application
                                </router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/users">
                                    BN/NAT listing
                                </router-link>
                            </li>
                        
                        <!-- normal user -->
                        <template v-if="!loggedInUser.hasBasicAccess && !loggedInUser.hasFullReadAccess">
                            <li class="nav-item">
                                <router-link class="nav-link" to="/modrequests">
                                    Request a BN
                                </router-link>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Other
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/yourevals">
                                        Your Evaluations
                                    </router-link>
                                    <router-link class="dropdown-item" to="/testresults">
                                        RC Test Results
                                    </router-link>
                                    <router-link class="dropdown-item" to="/reports">
                                        Reports
                                    </router-link>
                                    <router-link class="dropdown-item" to="/vetoes">
                                        Vetoes (read-only)
                                    </router-link>
                                    <router-link class="dropdown-item" to="/qualityassurance">
                                        Quality Assurance (read-only)
                                    </router-link>
                                    <router-link class="dropdown-item" to="/discussionvote">
                                        Content Review (read-only)
                                    </router-link>
                                </div>
                            </li>
                        </template>

                        <!-- BN -->

                        <template v-else-if="loggedInUser.hasBasicAccess && !loggedInUser.hasFullReadAccess">
                            <li class="nav-item">
                                <router-link class="nav-link" to="/modrequests">
                                    Request a BN
                                </router-link>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Other
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/yourevals">
                                        Your Evaluations
                                    </router-link>
                                    <router-link class="dropdown-item" to="/testresults">
                                        RC Test Results
                                    </router-link>
                                    <router-link class="dropdown-item" to="/reports">
                                        Reports
                                    </router-link>
                                </div>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    BN pages
                                </a>
                                <div class="dropdown-menu">
                                    <router-link v-if="!loggedInUser.isTrialNat" class="dropdown-item" to="/appeval">
                                        BN Application Evaluations
                                    </router-link>
                                    <router-link class="dropdown-item" to="/discussionvote">
                                        Content Review
                                    </router-link>
                                    <router-link class="dropdown-item" to="/vetoes">
                                        Vetoes
                                    </router-link>
                                    <router-link class="dropdown-item" to="/qualityassurance">
                                        Quality Assurance
                                    </router-link>
                                </div>
                            </li>

                            <!-- Trial NAT -->

                            <li v-if="loggedInUser.isTrialNat" class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Evaluations
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/appeval">
                                        Applications
                                    </router-link>
                                    <router-link class="dropdown-item" to="/bneval">
                                        Current BNs
                                    </router-link>
                                    <router-link class="dropdown-item" to="/evalarchive">
                                        Archive
                                    </router-link>
                                </div>
                            </li>
                        </template>

                        <!-- GMT -->

                        <template v-else-if="loggedInUser.hasFullReadAccess && !loggedInUser.isNat">
                            <li class="nav-item">
                                <router-link class="nav-link" to="/modrequests">
                                    Request a BN
                                </router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/discussionvote">
                                    Content Review
                                </router-link>
                            </li>
                            <li v-if="loggedInUser.hasFullReadAccess && !loggedInUser.isNat" class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Reports
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/reports">
                                        Reports
                                    </router-link>
                                    <router-link class="dropdown-item" to="/managereports">
                                        Manage Reports
                                    </router-link>
                                </div>
                            </li>

                            <!-- GMT + BN -->

                            <li v-if="loggedInUser.isBn" class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Other
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/yourevals">
                                        Your Evaluations
                                    </router-link>
                                    <router-link class="dropdown-item" to="/testresults">
                                        RC Test Results
                                    </router-link>
                                </div>
                            </li>
                            <li v-if="loggedInUser.isBn" class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    BN pages
                                </a>
                                <div class="dropdown-menu">
                                    <router-link v-if="!loggedInUser.isTrialNat" class="dropdown-item" to="/appeval">
                                        BN Application Evaluations
                                    </router-link>
                                    <router-link class="dropdown-item" to="/vetoes">
                                        Vetoes
                                    </router-link>
                                    <router-link class="dropdown-item" to="/qualityassurance">
                                        Quality Assurance
                                    </router-link>
                                </div>
                            </li>

                            <!-- GMT + Trial NAT -->

                            <li v-if="loggedInUser.isTrialNat" class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Evaluations
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/appeval">
                                        Applications
                                    </router-link>
                                    <router-link class="dropdown-item" to="/bneval">
                                        Current BNs
                                    </router-link>
                                    <router-link class="dropdown-item" to="/evalarchive">
                                        Archive
                                    </router-link>
                                </div>
                            </li>

                            <!-- GMT -->

                            <li v-if="!loggedInUser.isBn" class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Other
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/yourevals">
                                        Your Evaluations
                                    </router-link>
                                    <router-link class="dropdown-item" to="/testresults">
                                        RC Test Results
                                    </router-link>
                                    <router-link class="dropdown-item" to="/vetoes">
                                        Vetoes (read-only)
                                    </router-link>
                                    <router-link class="dropdown-item" to="/qualityassurance">
                                        Quality Assurance (read-only)
                                    </router-link>
                                </div>
                            </li>
                        </template>

                        <!-- NAT -->

                        <template v-else-if="loggedInUser.hasFullReadAccess">
                            <li v-if="loggedInUser.hasFullReadAccess" class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Reports
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/reports">
                                        Reports
                                    </router-link>
                                    <router-link class="dropdown-item" to="/managereports">
                                        Manage Reports
                                    </router-link>
                                </div>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Other
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/vetoes">
                                        Vetoes
                                    </router-link>
                                    <router-link class="dropdown-item" to="/discussionvote">
                                        Content Review
                                    </router-link>
                                    <router-link class="dropdown-item" to="/qualityassurance">
                                        Quality Assurance
                                    </router-link>
                                    <router-link class="dropdown-item" to="/modrequests">
                                        Request a BN
                                    </router-link>
                                </div>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    Evaluations
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/appeval">
                                        Applications
                                    </router-link>
                                    <router-link class="dropdown-item" to="/bneval">
                                        Current BNs
                                    </router-link>
                                    <router-link class="dropdown-item" to="/evalarchive">
                                        Archive
                                    </router-link>
                                    <router-link class="dropdown-item" to="/datacollection">
                                        Manage SEVs
                                    </router-link>
                                    <router-link class="dropdown-item" to="/yourevals">
                                        Your Evaluations
                                    </router-link>
                                </div>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">
                                    RC Test
                                </a>
                                <div class="dropdown-menu">
                                    <router-link class="dropdown-item" to="/managetest">
                                        Questions
                                    </router-link>
                                    <router-link class="dropdown-item" to="/testresults">
                                        Results
                                    </router-link>
                                </div>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/spam">
                                    Spam
                                </router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/logs">
                                    Logs
                                </router-link>
                            </li>
                        </template>
                        
                        <li v-if="loggedInUser.isPishifat" class="nav-item">
                            <a
                                class="nav-link"
                                href="#"
                                data-toggle="modal"
                                data-target="#DebugMenu"
                            >
                                <i class="fas fa-bug text-warning" />
                            </a>
                        </li>

                        <li class="nav-item">
                            <a
                                class="nav-link"
                                href="#"
                                data-toggle="modal"
                                data-target="#globalSettings"
                            >
                                <i class="fas fa-cog text-info" />
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link" href="/logout">
                                <i class="fas fa-sign-out-alt text-danger" />
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>

        <div
            class="container py-4"
            :class="{ 'body-content-padding': loggedInUser }"
        >
            <div v-if="loggedInUser" class="card">
                <div class="card-header d-flex align-items-center">
                    <div class="card-header-img" />
                    <h4 class="mb-0">
                        {{ title || 'Home' }}
                    </h4>
                </div>
            </div>

            <loading-page>
                <transition-group name="route-transition" mode="out-in">
                    <section v-if="initialized && !loggedInUser" key="login" class="card card-body">
                        <div class="row">
                            <div class="col-lg-5 text-center mb-3 mb-lg-0">
                                <div class="my-3">
                                    <img
                                        src="/images/qatlogo.png"
                                        alt="NAT"
                                        class="mr-1"
                                        style="border-radius: 100%; box-shadow: 0px 1px 5px #41bba12e; width: 130px;"
                                    >
                                </div>
                                <div v-if="!isPublicPage" class="text-danger font-weight-bold my-3 text-center">
                                    Login first to visit this page!
                                </div>
                                <a href="/login" class="btn btn-lg btn-primary" type="submit">
                                    Authorize your osu! account
                                </a>
                            </div>

                            <div class="col-lg-7 d-flex flex-column justify-content-center">
                                <p>"Authorizing" will identify you through your osu! account.</p>
                                <p>You can do any of these after authorization:</p>
                                <ul>
                                    <li>Apply to join the Beatmap Nominators</li>
                                    <li>Report members of the BN/NAT</li>
                                    <li>View detailed BN/NAT listings, beatmap vetoes, and beatmap quality assurance info</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                    <router-view v-if="loggedInUser || isPublicPage" key="page" />
                </transition-group>
            </loading-page>
        </div>

        <debug-modal v-if="loggedInUser && loggedInUser.isPishifat" />
        <settings-modal v-if="loggedInUser" />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import LoadingPage from './components/LoadingPage.vue';
import SettingsModal from './components/settingsModal/SettingsModal.vue';
import DebugModal from './components/debugModal/DebugModal.vue';

export default {
    components: {
        LoadingPage,
        SettingsModal,
        DebugModal,
    },
    computed: {
        ...mapState([
            'initialized',
            'loggedInUser',
        ]),
        /** @returns {string} */
        title () {
            return this.$route.meta.title;
        },
        /** @returns {boolean} */
        isPublicPage () {
            return this.$route.meta.public;
        },
    },
};
</script>
