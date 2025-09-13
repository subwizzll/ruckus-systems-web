'use client'

import { Mail, Phone, Github, Linkedin } from 'lucide-react'

export function ContactInfo() {
  const contactItems = [
    {
      icon: Phone,
      text: '828-606-2469',
      href: 'tel:828-606-2469',
    },
    {
      icon: Mail,
      text: 'jared@ruckussystems.dev',
      href: 'mailto:jared@ruckussystems.dev',
    },
    {
      icon: Linkedin,
      text: 'linkedin.com/in/ruckussystems',
      href: 'https://linkedin.com/in/ruckussystems',
    },
    {
      icon: Github,
      text: 'github.com/subwizzll',
      href: 'https://github.com/subwizzll',
    },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-600 dark:text-gray-400 mb-8">
      {contactItems.map((item, index) => {
        const Icon = item.icon
        return (
          <a
            key={index}
            href={item.href}
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 group"
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">{item.text}</span>
          </a>
        )
      })}
    </div>
  )
}