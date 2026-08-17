// Single source of truth for the admin account identity. Previously
// hardcoded independently in App.jsx (AdminRoute) and SellerDashboard.jsx,
// plus several Postgres migrations/edge functions (those stay literal --
// SQL can't import a JS constant, but they're all commented to point back
// here). If this ever changes, missing a spot silently reopens whatever
// that one location was gating.
export const ADMIN_EMAIL = 'julsina76@gmail.com';
