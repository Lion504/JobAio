import { motion } from 'framer-motion'
import type { JobStat } from './data'

interface SimpleBarChartProps {
  data: JobStat[]
  colorClass?: string
  title: string
  icon?: React.ReactNode
}

export function SimpleBarChart({
  data,
  colorClass = 'bg-indigo-500',
  title,
  icon,
}: SimpleBarChartProps) {
  return (
    <div className="w-full p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        {icon && (
          <div className="p-2 bg-white/5 rounded-lg text-indigo-400">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      </div>

      <div className="space-y-4 relative z-10">
        {data.map((item, index) => (
          <div key={item.label} className="w-full">
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="text-gray-300 group-hover:text-white transition-colors">
                {item.label}
              </span>
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <span>{item.count}</span>
                <span className="opacity-50">|</span>
                <span className={colorClass.replace('bg-', 'text-')}>
                  {item.percentage}%
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(item.percentage, 100)}%` }}
                viewport={{ once: true }}
                transition={{
                  duration: 1,
                  delay: index * 0.1,
                  type: 'spring',
                  bounce: 0,
                }}
                className={`h-full rounded-full ${colorClass} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
