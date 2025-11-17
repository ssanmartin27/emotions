import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    layout("routes/auth/layout.tsx", [
        route("sign-in/*", "routes/auth/sign-in.tsx"),
        route("role/*", "routes/auth/select-role.tsx"),
        route("sign-up/therapist/*", "routes/auth/sign-up-therapist.tsx"),
        route("sign-up/parent/*", "routes/auth/sign-up-parent.tsx"),
        route("forgot-password/*", "routes/auth/forgot-password.tsx")
    ]),
    layout("routes/main/layout.tsx", [
        route("therapist/profile", "routes/main/therapist_profile.tsx"),
        route("therapist/calendar", "routes/main/calendar.tsx"),
        route("therapist/process-charts", "routes/main/process_charts.tsx"),
        route("therapist/children-list", "routes/main/children.tsx"),
        route("therapist/create-report", "routes/main/create_report.tsx"),
        route("therapist/reports", "routes/main/reports/index.tsx"),
        route("therapist/reports/:reportId", "routes/main/reports/$reportId.tsx"),
        route("therapist/reports/:reportId/edit", "routes/main/reports/$reportId.edit.tsx"),
        route("therapist/children/:childId", "routes/main/children/$childId.tsx"),
        route("therapist/children/:childId/reports", "routes/main/children/$childId.reports.tsx"),
        route("therapist/*", "routes/main/home.tsx"),
    ]),
    layout("routes/parent/layout.tsx", [
        route("parent/profile", "routes/parent/profile.tsx"),
        route("parent/faq", "routes/parent/faq.tsx"),
        route("parent/assessments", "routes/parent/assessments.tsx"),
        route("parent/assessments/:reportId", "routes/parent/assessments/$reportId.tsx"),
        route("parent/progress", "routes/parent/progress.tsx"),
        route("parent/*", "routes/parent/home.tsx"),
    ]),
    route("admin/seed", "routes/admin/seed.tsx"),
    route("models/:filename", "routes/models.$filename.tsx")
    ] satisfies RouteConfig;
