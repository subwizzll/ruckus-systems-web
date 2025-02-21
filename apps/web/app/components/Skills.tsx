export default function Skills() {
  const skills = [
    "Python",
    "Java",
    "C#",
    "TypeScript",
    "SQL",
    "AWS",
    "PostgreSQL",
    "MS SQL Server",
    "Docker",
    "Django",
    "ASP.NET Core",
    "React Native",
    "DataDog",
    "Sentry",
    "CI/CD",
    "Next.js",
    "GitHub",
    "GitLab",
    
  ]

  return (
    <section id="skills" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Technical Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {skills.map((skill, index) => (
            <div key={index} className="bg-white p-4 rounded shadow text-center">
              {skill}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

