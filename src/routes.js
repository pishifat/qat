import Home from './pages/Home.vue';
import NotFound from './pages/NotFound.vue';
import ModRequestsSubmission from './pages/ModRequestsSubmission.vue';
const ApplicationSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/ApplicationSubmission.vue');
const TestSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/TestSubmissionPage.vue');
const ReportSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/ReportSubmission.vue');
const Users = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/UsersPage.vue');
const Vetoes = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/VetoesPage.vue');
const QualityAssurance = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/QualityAssurancePage.vue');
const TestResults = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/TestResultsPage.vue');
const YourEvals = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/YourEvalsPage.vue');
const Message = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/MessagePage.vue');

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
    { path: '/modrequests', component: ModRequestsSubmission, meta: { title: 'Mod Requests', public: true } },

    // BN/NAT
    { path: '/discussionvote', component: DiscussionVote, meta: { title: 'Content Review', requiresBasicAccess: true } },
    { path: '/appeval', component: AppEvalPage, meta: { title: 'BN Application Evaluations', requiresBasicAccess: true } },
    { path: '/modrequests/listing', component: ModRequests, meta: { title: 'Mod Requests Listing', requiresBasicAccess: true } },

    // NAT and Trial NAT
    { path: '/bneval', component: BnEvalPage, meta: { title: 'Current BN Evaluations', requiresFullReadAccessOrTrialNat: true } },

    // NAT
    { path: '/managereports', component: ManageReports, meta: { title: 'Manage Reports', requiresFullReadAccess: true } },
    { path: '/evalarchive', component: EvalArchive, meta: { title: 'Evaluation Archives', requiresFullReadAccess: true } },
    { path: '/datacollection', component: DataCollection, meta: { title: 'Data Collection', requiresFullReadAccess: true } },
    { path: '/managetest', component: ManageTest, meta: { title: 'Manage RC Test', requiresFullReadAccess: true } },
    { path: '/logs', component: Logs, meta: { title: 'Logs', requiresFullReadAccess: true } },
    { path: '/spam', component: Spam, meta: { title: 'Spam', requiresFullReadAccess: true } },

    { path: '*', component: NotFound, meta: { title: 'Oops', public: true } },
];

export default routes;
