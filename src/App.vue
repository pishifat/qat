<template>
    <div
        v-cloak
        id="app"
    >
        <header v-if="loggedInUser">
            <nav
                id="top"
                class="navbar navbar-expand-md navbar-dark navbar-nat"
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
                        <li v-else class="nav-item">
                            <router-link class="nav-link" to="/reports">
                                Reports
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/users">
                                Users
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/vetoes">
                                Vetoes
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/qualityassurance">
                                Quality Assurance
                            </router-link>
                        </li>
                        <template v-if="loggedInUser.isBn && !loggedInUser.isNat">
                            <li class="nav-item">
                                <router-link class="nav-link" to="/discussionvote">
                                    Discussion Vote
                                </router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/appeval">
                                    BN Application Evaluations
                                </router-link>
                            </li>
                        </template>
                        <template v-else-if="loggedInUser.hasFullReadAccess">
                            <li class="nav-item">
                                <router-link class="nav-link" to="/discussionvote">
                                    Discussion Vote
                                </router-link>
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
                                        Data collection
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
                                <router-link class="nav-link" to="/logs">
                                    Logs
                                </router-link>
                            </li>
                        </template>
                    </ul>
                </div>
            </nav>
        </header>

        <div
            :class="{ 'container pb-4 body-content-padding': loggedInUser }"
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
                <transition name="route-transition" mode="out-in">
                    <router-view />
                </transition>
            </loading-page>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import LoadingPage from './components/LoadingPage.vue';

export default {
    components: {
        LoadingPage,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        title () {
            return this.$route.meta.title;
        },
    },
};
</script>
