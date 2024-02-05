import Home from './pages/Home.vue';
import NotFound from './pages/NotFound.vue';
const ApplicationSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/ApplicationSubmission.vue');
const TestSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/TestSubmissionPage.vue');
const ReportSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/ReportSubmission.vue');
const Users = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/UsersPage.vue');
const Vetoes = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/VetoesPage.vue');
const QualityAssurance = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/QualityAssurancePage.vue');
const TestResults = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/TestResultsPage.vue');
const YourEvals = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/YourEvalsPage.vue');
const Message = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/MessagePage.vue');
const GroupHistory = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/GroupHistoryPage.vue');

const ModRequests = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/ModRequests.vue');
const DiscussionVote = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/DiscussionVotePage.vue');
const AppEvalPage = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/AppEvalPage.vue');

const BnEvalPage = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/BnEvalPage.vue'); // trial NAT only

const ManageReports = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/ManageReportsPage.vue');
const EvalArchive = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/EvalArchivePage.vue');
const DataCollection = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/DataCollectionPage.vue');
const ManageTest = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/ManageTestPage.vue');
const Logs = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/Logs.vue');
const Spam = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/Spam.vue');

/**
 * ! when adding/editing routes here, make sure you do the same adjustments in /helpers/middlewares.js (discordEmbeds)
 */

const routes = [
    // Public
    { path: '/', component: Home, alias: '/home', name: 'home', meta: { public: true } },
    { path: '/bnapps', component: ApplicationSubmission, meta: { title: 'Beatmap Nominator Application' } },
    { path: '/testsubmission', component: TestSubmission, meta: { title: 'Test Submission' } },
    { path: '/reports', component: ReportSubmission, meta: { title: 'Report Submission' } },
    { path: '/users', component: Users, meta: { title: 'BN/NAT Listing' } },
    { path: '/vetoes', component: Vetoes, meta: { title: 'Vetoes' } },
    { path: '/qualityassurance', component: QualityAssurance, meta: { title: 'Quality Assurance' } },
    { path: '/testresults', component: TestResults, meta: { title: 'Ranking Criteria Test Results' } },
    { path: '/yourevals', component: YourEvals, meta: { title: 'Your Evaluations' } },
    { path: '/message', component: Message, meta: { title: 'Message from the NAT' } },
    { path: '/modrequests', component: ModRequests, meta: { title: 'Request a BN', public: true } },
    { path: '/discussionvote', component: DiscussionVote, meta: { title: 'Content Review' } },
    { path: '/grouphistory', component: GroupHistory, meta: { title: 'Group History' } },

    // BN/NAT
    { path: '/appeval', component: AppEvalPage, meta: { title: 'BN Application Evaluations', requiresBnOrNat: true } },

    // NAT/Trial NAT
    { path: '/bneval', component: BnEvalPage, meta: { title: 'Current BN Evaluations', requiresNatOrTrialNat: true } },
    { path: '/evalarchive', component: EvalArchive, meta: { title: 'Evaluation Archives', requiresNatOrTrialNat: true } },

    // NAT/GMT
    { path: '/managereports', component: ManageReports, meta: { title: 'Manage Reports', requiresFullReadAccess: true } },

    // NAT
    { path: '/datacollection', component: DataCollection, meta: { title: 'Manage Resets', requiresNat: true } },
    { path: '/managetest', component: ManageTest, meta: { title: 'Manage RC Test', requiresNat: true } },
    { path: '/logs', component: Logs, meta: { title: 'Logs' } },
    { path: '/spam', component: Spam, meta: { title: 'Spam', requiresNat: true } },

    { path: '*', component: NotFound, meta: { title: 'Oops', public: true } },
];

export default routes;
