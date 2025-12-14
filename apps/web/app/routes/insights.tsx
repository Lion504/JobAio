import JobMarketInsights from '~/components/JobMarketInsights/JobMarketInsights'

export function meta() {
  return [
    { title: 'Market Insights - JobAio' },
    { name: 'description', content: 'AI-Powered Job Market Analysis' },
  ]
}

export default function Insights() {
  return <JobMarketInsights />
}
