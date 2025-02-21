"use client"

import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa"

export default function Contact() {

  const socialLinks = [
    {
      name: "LinkedIn",
      url: "https://linkedin.com/in/ruckussystems",
      icon: <FaLinkedin className="w-6 h-6" />,
    },
    {
      name: "GitHub",
      url: "https://github.com/subwizzll",
      icon: <FaGithub className="w-6 h-6" />,
    },
    {
      name: "Email",
      url: "mailto:jared@ruckussystems.dev",
      icon: <FaEnvelope className="w-6 h-6" />,
    },
  ]

  return (
    <section id="contact" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Contact Me</h2>
        
        {/* Social Media Links */}
        <div className="max-w-lg mx-auto mb-12">
          <h3 className="text-xl font-semibold mb-4 text-center">Connect with me on social media</h3>
          <div className="flex justify-center space-x-8">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-500 transition-colors duration-200"
                aria-label={`Connect on ${link.name}`}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

