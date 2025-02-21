import Image from "next/image"

export default function Projects() {
  const projects = [
    {
      title: "Health Data Integration Platform",
      description:
        "Designed and implemented a scalable data pipeline for integrating wearable devices and EHR systems using Python, AWS, and PostgreSQL.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Electronic Logging Device System",
      description:
        "Developed a regulatory-compliant system for electronic logging devices using C#, ASP.NET Core, and MS SQL Server.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "RFID-based Inventory Management",
      description:
        "Led the development of an RFID-based inventory management system using Azure and AWS services, reducing labor costs by over $10,000 annually.",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  return (
    <section id="projects" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Projects</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* <Image
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                width={300}
                height={200}
                className="w-full"
              /> */}
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">{project.title}</h3>
                <p className="text-gray-700">{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

