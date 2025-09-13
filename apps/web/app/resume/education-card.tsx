'use client'

import { GraduationCap, MapPin, Calendar, Award } from 'lucide-react'

interface EducationCardProps {
  school: string
  location: string
  degree: string
  graduationYear: string
  gpa: string
}

export function EducationCard({ school, location, degree, graduationYear, gpa }: EducationCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
          <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {school}
          </h3>
          
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">{degree}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{graduationYear}</span>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                <span className="font-medium">GPA: {gpa}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}