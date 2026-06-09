import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true },
  },
  // ── Admin (super admin — all CRUD) ──
  {
    path: '/admin',
    meta: { role: 'admin' as Role },
    children: [
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/dashboard/AdminDashboard.vue') },
      { path: 'tests', name: 'admin-tests', component: () => import('@/views/admin/TestList.vue') },
      { path: 'tests/new', name: 'admin-test-new', component: () => import('@/views/admin/TestForm.vue') },
      { path: 'tests/:id', name: 'admin-test-edit', component: () => import('@/views/admin/TestForm.vue') },
      { path: 'materi', name: 'admin-materi', component: () => import('@/views/admin/MateriList.vue') },
      { path: 'materi/new', name: 'admin-materi-new', component: () => import('@/views/admin/MateriForm.vue') },
      { path: 'materi/:id', name: 'admin-materi-edit', component: () => import('@/views/admin/MateriForm.vue') },
      { path: 'inclass', name: 'admin-inclass', component: () => import('@/views/admin/InClassList.vue') },
      { path: 'inclass/new', name: 'admin-inclass-new', component: () => import('@/views/admin/InClassForm.vue') },
      { path: 'inclass/:id', name: 'admin-inclass-edit', component: () => import('@/views/admin/InClassForm.vue') },
      { path: 'form-builder', name: 'admin-form-builder', component: () => import('@/views/admin/FormAssessmentList.vue') },
      { path: 'form-builder/new', name: 'admin-form-builder-new', component: () => import('@/views/admin/FormAssessmentForm.vue') },
      { path: 'form-builder/:id', name: 'admin-form-builder-edit', component: () => import('@/views/admin/FormAssessmentForm.vue') },
      { path: 'multirater', name: 'admin-multirater', component: () => import('@/views/admin/MultiraterList.vue') },
      { path: 'multirater/new', name: 'admin-multirater-new', component: () => import('@/views/admin/MultiraterForm.vue') },
      { path: 'multirater/:id', name: 'admin-multirater-edit', component: () => import('@/views/admin/MultiraterForm.vue') },
      { path: 'presentation', name: 'admin-presentation', component: () => import('@/views/admin/PresentationList.vue') },
      { path: 'presentation/new', name: 'admin-presentation-new', component: () => import('@/views/admin/PresentationForm.vue') },
      { path: 'presentation/:id', name: 'admin-presentation-edit', component: () => import('@/views/admin/PresentationForm.vue') },
      { path: 'validation', name: 'admin-validation', component: () => import('@/views/admin/ValidationList.vue') },
      { path: 'validation/new', name: 'admin-validation-new', component: () => import('@/views/admin/ValidationForm.vue') },
      { path: 'validation/:id', name: 'admin-validation-edit', component: () => import('@/views/admin/ValidationForm.vue') },
      { path: 'skill-test', name: 'admin-skill-test', component: () => import('@/views/admin/SkillTestList.vue') },
      { path: 'skill-test/new', name: 'admin-skill-test-new', component: () => import('@/views/admin/SkillTestForm.vue') },
      { path: 'skill-test/:id', name: 'admin-skill-test-edit', component: () => import('@/views/admin/SkillTestForm.vue') },
      { path: 'verify', name: 'admin-verify', component: () => import('@/views/admin/VerifyList.vue') },
      { path: 'verify/new', name: 'admin-verify-new', component: () => import('@/views/admin/VerifyForm.vue') },
      { path: 'verify/:id', name: 'admin-verify-edit', component: () => import('@/views/admin/VerifyForm.vue') },
      { path: 'accounting', name: 'admin-accounting', component: () => import('@/views/admin/AccountingList.vue') },
      { path: 'accounting/new', name: 'admin-accounting-new', component: () => import('@/views/admin/AccountingForm.vue') },
      { path: 'accounting/:id', name: 'admin-accounting-edit', component: () => import('@/views/admin/AccountingForm.vue') },
      { path: 'curriculum', name: 'admin-curriculum', component: () => import('@/views/admin/CurriculumList.vue') },
      { path: 'curriculum/new', name: 'admin-curriculum-new', component: () => import('@/views/admin/CurriculumForm.vue') },
      { path: 'curriculum/:id', name: 'admin-curriculum-edit', component: () => import('@/views/admin/CurriculumForm.vue') },
      { path: 'classes', name: 'admin-classes', component: () => import('@/views/admin/ClassList.vue') },
      { path: 'classes/new', name: 'admin-class-new', component: () => import('@/views/admin/ClassForm.vue') },
      { path: 'classes/:id/edit', name: 'admin-class-edit', component: () => import('@/views/admin/ClassForm.vue') },
      { path: 'classes/:id', name: 'admin-class-detail', component: () => import('@/views/admin/ClassDetail.vue') },
      { path: 'knowledge-tests', name: 'admin-knowledge-tests', component: () => import('@/views/admin/KnowledgeTestList.vue') },
      { path: 'knowledge-tests/new', name: 'admin-knowledge-test-new', component: () => import('@/views/admin/KnowledgeTestForm.vue') },
      { path: 'knowledge-tests/:id', name: 'admin-knowledge-test-edit', component: () => import('@/views/admin/KnowledgeTestForm.vue') },
      { path: 'knowledge-tests/:id/results', name: 'admin-knowledge-test-results', component: () => import('@/views/admin/KnowledgeTestResult.vue') },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UserManagement.vue') },
      { path: 'audit', name: 'admin-audit', component: () => import('@/views/admin/AuditLogView.vue') },
    ],
  },
  // ── Instructor (read-only + scoring) ──
  {
    path: '/instructor',
    meta: { role: 'instructor' as Role },
    children: [
      { path: 'dashboard', name: 'instructor-dashboard', component: () => import('@/views/dashboard/InstructorDashboard.vue') },
      { path: 'classes', name: 'instructor-classes', component: () => import('@/views/instructor/ClassList.vue') },
      { path: 'classes/:id', name: 'instructor-class-detail', component: () => import('@/views/instructor/ClassDetail.vue') },
      { path: 'classes/:id/scores', name: 'instructor-class-scores', component: () => import('@/views/instructor/ScoreView.vue') },
      { path: 'khs', name: 'instructor-khs', component: () => import('@/views/instructor/KHSView.vue') },
      { path: 'lgi', name: 'instructor-lgi', component: () => import('@/views/instructor/LGIView.vue') },
    ],
  },
  // ── Participant ──
  {
    path: '/participant',
    meta: { role: 'participant' as Role },
    children: [
      { path: 'dashboard', name: 'participant-dashboard', component: () => import('@/views/dashboard/ParticipantDashboard.vue') },
      { path: 'tests', name: 'participant-tests', component: () => import('@/views/testTaker/TestListView.vue') },
      { path: 'tests/:id/take', name: 'participant-test-take', component: () => import('@/views/testTaker/TestTakerView.vue') },
      { path: 'tests/:id/result', name: 'participant-test-result', component: () => import('@/views/testTaker/TestResultView.vue') },
      { path: 'progress', name: 'participant-progress', component: () => import('@/views/progress/ParticipantProgress.vue') },
      { path: 'transcript', name: 'participant-transcript', component: () => import('@/views/transcript/TranscriptView.vue') },
    ],
  },
  // ── Rater ──
  {
    path: '/rater',
    meta: { role: 'rater' as Role },
    children: [
      { path: 'dashboard', name: 'rater-dashboard', component: () => import('@/views/dashboard/RaterDashboard.vue') },
      { path: 'assessments', name: 'rater-assessments', component: () => import('@/views/assessment/AssessmentList.vue') },
      { path: 'assessments/:id', name: 'rater-assessment-form', component: () => import('@/views/assessment/AssessmentForm.vue') },
    ],
  },
  // ── Supervisor ──
  {
    path: '/supervisor',
    meta: { role: 'supervisor' as Role },
    children: [
      { path: 'dashboard', name: 'supervisor-dashboard', component: () => import('@/views/dashboard/SupervisorDashboard.vue') },
      { path: 'classes', name: 'supervisor-classes', component: () => import('@/views/classMgmt/ClassList.vue') },
      { path: 'audit', name: 'supervisor-audit', component: () => import('@/views/audit/AuditLogView.vue') },
      { path: 'remedial', name: 'supervisor-remedial', component: () => import('@/views/remedial/RemedialView.vue') },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  auth.init()

  if (to.meta.role) {
    if (!auth.isAuthenticated) {
      next('/login')
    } else if (auth.userRole !== to.meta.role) {
      next(`/${auth.userRole}/dashboard`)
    } else {
      next()
    }
  } else if (to.meta.guest) {
    if (auth.isAuthenticated) {
      next(`/${auth.userRole}/dashboard`)
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
