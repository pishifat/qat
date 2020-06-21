import Home from './pages/Home.vue';
const ApplicationSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/ApplicationSubmission.vue');
const TestSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/TestSubmissionPage.vue');
const ReportSubmission = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/ReportSubmission.vue');
const Users = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/UsersPage.vue');
const Vetoes = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/VetoesPage.vue');
const QualityAssurance = () => import(/* webpackChunkName: "public", webpackPrefetch: true */ './pages/QualityAssurancePage.vue');

const DiscussionVote = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/DiscussionVotePage.vue');
const AppEvalPage = () => import(/* webpackChunkName: "bn", webpackPrefetch: true */ './pages/AppEvalPage.vue');

const ManageReports = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/ManageReportsPage.vue');
const BnEvalPage = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/BnEvalPage.vue');
const EvalArchive = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/EvalArchivePage.vue');
const DataCollection = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/DataCollectionPage.vue');
const ManageTest = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/ManageTestPage.vue');
const TestResults = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/TestResultsPage.vue');
const Logs = () => import(/* webpackChunkName: "nat", webpackPrefetch: true */ './pages/Logs.vue');

const routes = [
    // Public
    { path: '/', component: Home },
    { path: '/home', component: Home },
    { path: '/bnapps', component: ApplicationSubmission, meta: { title: 'Beatmap Nominator Application' } },
    { path: '/testsubmission', component: TestSubmission, meta: { title: 'Test Submission' } },
    { path: '/reports', component: ReportSubmission, meta: { title: 'Reports Submission' } },
    { path: '/users', component: Users, meta: { title: 'BN/NAT Listing' } },
    { path: '/vetoes', component: Vetoes, meta: { title: 'Vetoes' } },
    { path: '/qualityassurance', component: QualityAssurance, meta: { title: 'Quality Assurance' } },
    { path: '/testresults', component: TestResults, meta: { title: 'Ranking Criteria Test Results' } },

    // BN/NAT
    { path: '/discussionvote', component: DiscussionVote, meta: { title: 'Discussion Vote' } },
    { path: '/appeval', component: AppEvalPage, meta: { title: 'BN Application Evaluations' } },

    // NAT
    { path: '/managereports', component: ManageReports, meta: { title: 'Manage Reports' } },
    { path: '/bneval', component: BnEvalPage, meta: { title: 'Current BN Evaluations' } },
    { path: '/evalarchive', component: EvalArchive, meta: { title: 'Evaluation Archives' } },
    { path: '/datacollection', component: DataCollection, meta: { title: 'Data Collection' } },
    { path: '/managetest', component: ManageTest, meta: { title: 'Manage RC Test' } },
    { path: '/logs', component: Logs, meta: { title: 'Logs' } },

    { path: '*', redirect: '/' },
];

export default routes;
