import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { SimpleBarChart } from './SimpleBarChart'
import { initialInsights, type MarketInsights } from './data'
import {
  Briefcase,
  Code2,
  GraduationCap,
  Globe,
  Layers,
  Cpu,
  Database,
} from 'lucide-react'

export default function JobMarketInsights() {
  const [data, setData] = useState<MarketInsights>(initialInsights)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('http://localhost:5001/api/jobs/stats')
        if (response.ok) {
          const stats = await response.json()
          setData(stats)
        }
      } catch (error) {
        console.error('Failed to fetch stats', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
        >
          <Cpu size={48} className="text-indigo-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={item} className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-full mb-4 ring-1 ring-indigo-500/20 backdrop-blur-sm">
            <span className="text-indigo-400 text-sm font-medium px-2">
              AI-Powered Analysis
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
            Market Intelligence
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Real-time insights extracted from {data.totalJobs.toLocaleString()}{' '}
            active job listings using our advanced hybrid analysis engine.
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Jobs Analyzed"
            value={data.totalJobs.toString()}
            icon={<Briefcase />}
            delay={0}
          />
          <MetricCard
            label="Top Skill"
            value={data.topSkills[0]?.label || 'N/A'}
            subValue={
              data.topSkills[0] ? `${data.topSkills[0].percentage}% demand` : ''
            }
            icon={<Code2 />}
            delay={0.1}
          />
          <MetricCard
            label="Most Sought Role"
            value="Full Stack Dev"
            subValue="High demand"
            icon={<Layers />}
            delay={0.2}
          />
          <MetricCard
            label="Avg. Processing Time"
            value="1.2s"
            subValue="per job"
            icon={<Cpu />}
            delay={0.3}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item} className="space-y-6">
            <SimpleBarChart
              title="Top Technical Skills"
              data={data.topSkills}
              icon={<Database size={20} />}
              colorClass="bg-blue-500"
            />
            <SimpleBarChart
              title="Language Requirements"
              data={data.languages}
              icon={<Globe size={20} />}
              colorClass="bg-emerald-500"
            />
          </motion.div>

          <motion.div variants={item} className="space-y-6">
            <SimpleBarChart
              title="Experience Level"
              data={data.experienceDistribution}
              icon={<Briefcase size={20} />}
              colorClass="bg-violet-500"
            />
            <SimpleBarChart
              title="Education Requirements"
              data={data.educationDistribution}
              icon={<GraduationCap size={20} />}
              colorClass="bg-pink-500"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  subValue,
  icon,
  delay,
}: {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay, duration: 0.5 }}
      className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 group-hover:text-white group-hover:bg-indigo-500 transition-all">
          {icon}
        </div>
        {subValue && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
            {subValue}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="text-gray-400 text-sm font-medium">{label}</h4>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  )
}
