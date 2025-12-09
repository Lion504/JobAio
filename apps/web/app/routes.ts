import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes'

export default [
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('account', 'routes/account.tsx'),
    route('signup', 'routes/signup.tsx'),
    route('saved', 'routes/saved.tsx'),
    route('suggestions', 'routes/suggestions.tsx'),
    route('preferences', 'routes/preferences.tsx'),
    route('insights', 'routes/insights.tsx'),
    route('*', 'routes/not-found.tsx'),
  ]),
] satisfies RouteConfig
