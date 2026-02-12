import Home from './pages/Home.vue';
import NotFound from './pages/NotFound.vue';
const ApplicationSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/ApplicationSubmission.vue');
const ReportSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/ReportSubmission.vue');
const Users = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/UsersPage.vue');
const Vetoes = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/VetoesPage.vue');
const QualityAssurance = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/QualityAssurancePage.vue');
const YourEvals = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/YourEvalsPage.vue');
const Message = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/MessagePage.vue');
const GroupHistory = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/GroupHistoryPage.vue');
const PublicEvalArchive = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/PublicEvalArchivePage.vue');

const ModRequests = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/ModRequests.vue');
const BnCharts = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/BnCharts.vue');
const DiscussionVote = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/DiscussionVotePage.vue');
const AppEvalPage = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/AppEvalPage.vue');

const BnEvalPage = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/BnEvalPage.vue'); // trial NAT only

const ManageReports = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/ManageReportsPage.vue');
const EvalArchive = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/EvalArchivePage.vue');
const DataCollection = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/DataCollectionPage.vue');
const Logs = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/Logs.vue');
const Spam = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/Spam.vue');
const DocumentationIndex = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/DocumentationIndexPage.vue');
const Documentation = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/DocumentationPage.vue');

/**
 * ! when adding/editing routes here, make sure you do the same adjustments in /helpers/middlewares.js (discordEmbeds)
 */

const routes = [
    // Public
    { path: '/', component: Home, alias: '/home', name: 'home', meta: { public: true } },
    { path: '/bnapps', component: ApplicationSubmission, meta: { title: 'Beatmap Nominator Application' }, meta: { public: true } },
    { path: '/reports', component: ReportSubmission, meta: { title: 'Report Submission' }, meta: { public: true } },
    { path: '/users', component: Users, meta: { title: 'BN/NAT Listing' }, meta: { public: true } },
    { path: '/vetoes', component: Vetoes, meta: { title: 'Vetoes' }, meta: { public: true } },
    { path: '/qualityassurance', component: QualityAssurance, meta: { title: 'Quality Assurance' } },
    { path: '/yourevals', component: YourEvals, meta: { title: 'Your Evaluations' } },
    { path: '/message', component: Message, meta: { title: 'Message from the NAT' } },
    { path: '/modrequests', component: ModRequests, meta: { title: 'Request a BN', public: true } },
    { path: '/charts', component: BnCharts, meta: { title: 'BN Charts' } },
    { path: '/discussionvote', component: DiscussionVote, meta: { title: 'Content Review' } },
    { path: '/grouphistory', component: GroupHistory, meta: { title: 'Group History', public: true } },
    { path: '/publicarchive', component: PublicEvalArchive, meta: { title: 'Public Evaluation Archives' }, meta: { public: true } },

    // BN/NAT
    { path: '/appeval', component: AppEvalPage, meta: { title: 'BN Application Evaluations', requiresBnOrNat: true } },
    { path: '/bneval', component: BnEvalPage, meta: { title: 'Current BN Evaluations', requiresBnOrNat: true } },

    // NAT/Trial NAT
    { path: '/evalarchive', component: EvalArchive, meta: { title: 'Evaluation Archives', requiresNatOrTrialNat: true } },

    // NAT/GMT
    { path: '/managereports', component: ManageReports, meta: { title: 'Manage Reports', requiresFullReadAccess: true } },
    { path: '/docs', component: DocumentationIndex, meta: { title: 'Documentation', requiresFullReadAccess: true } },
    { path: '/docs/:slug', component: Documentation, meta: { title: 'Documentation', requiresFullReadAccess: true } },

    // NAT
    { path: '/datacollection', component: DataCollection, meta: { title: 'Manage Resets', requiresNat: true } },
    { path: '/logs', component: Logs, meta: { title: 'Logs' } },
    { path: '/spam', component: Spam, meta: { title: 'Spam', requiresNat: true } },

    { path: '/:pathMatch(.*)*', component: NotFound, meta: { title: 'Oops', public: true } },
];

export default routes;
