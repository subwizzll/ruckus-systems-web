export default function Experience() {
  const experiences = [
    {
      title: "Data Engineer",
      company: "Healthbook+",
      period: "Sept. 2024 – Present",
      responsibilities: [
        "Designed and maintained robust data pipelines for integrating wearable devices and EHR systems",
        "Utilized Python, Java, PostgreSQL, Docker, and AWS services like S3 and SQS",
        "Collaborated with cross-functional teams to optimize data models",
      ],
    },
    {
      title: "Full Stack Engineer",
      company: "Healthbook+",
      period: "Feb. 2024 – Sept. 2024",
      responsibilities: [
        "Developed a comprehensive health report feature using Python, Django, and PostgreSQL",
        "Enhanced system monitoring using AWS CloudWatch, DataDog, and Sentry",
        "Implemented CI/CD pipelines for React-Native apps",
      ],
    },
    {
      title: ".NET Developer",
      company: "R+L Carriers",
      period: "Apr. 2023 – Feb 2024",
      responsibilities: [
        "Built and optimized data reporting solutions using C#, MS SQL Server, and ASP.NET Core",
        "Designed regulatory-compliant systems for electronic logging devices",
      ],
    },
  ]

  return (
    <section id="experience" className="py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Professional Experience</h2>
        <div className="space-y-12">
          {experiences.map((exp, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold">{exp.title}</h3>
              <p className="text-gray-600">
                {exp.company} | {exp.period}
              </p>
              <ul className="mt-4 list-disc list-inside">
                {exp.responsibilities.map((resp, idx) => (
                  <li key={idx} className="text-gray-700">
                    {resp}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

