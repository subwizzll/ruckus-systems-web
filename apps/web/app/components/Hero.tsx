import Image from "next/image"

export default function Hero() {
  return (
    <section className="bg-gray-900 text-white py-20">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Full Stack Data Engineer</h1>
          <p className="text-xl mb-6">Building robust data pipelines and scalable full stack solutions</p>
          <a href="#contact" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Get in touch
          </a>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/headshot.jpeg"
            alt="Jared Russell"
            width={400}
            height={400}
            className="rounded-full"
          />
        </div>
      </div>
    </section>
  )
}

