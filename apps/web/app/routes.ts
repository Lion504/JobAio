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
    route('preferences', 'routes/preferences.tsx'),
  ]),
] satisfies RouteConfig
