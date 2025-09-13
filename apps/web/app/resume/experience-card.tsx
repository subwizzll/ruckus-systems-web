'use client'

import { MapPin, Calendar } from 'lucide-react'

interface ExperienceCardProps {
  title: string
  company: string
  location: string
  period: string
  achievements: string[]
}

export function ExperienceCard({ title, company, location, period, achievements }: ExperienceCardProps) {
  return (
    <div className="mb-12 bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-600 dark:text-blue-400 text-lg">
              {company}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="capitalize">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{period}</span>
            </div>
          </div>
        </div>
      </div>
      
      <ul className="space-y-4">
        {achievements.map((achievement, index) => (
          <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 leading-relaxed">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>{achievement}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}