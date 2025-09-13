import Link from "next/link"

export default function Header() {
  return (
    <header className="bg-gray-800 text-white">
      <nav className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">
            <Link href="/">Jared Russell</Link>
          </div>
          <div className="hidden md:flex space-x-4">
            <Link href="#skills" className="hover:text-gray-300">
              Skills
            </Link>
            <Link href="#experience" className="hover:text-gray-300">
              Experience
            </Link>
            <Link href="#projects" className="hover:text-gray-300">
              Projects
            </Link>
            <Link href="/resume" className="hover:text-gray-300 bg-blue-600 px-3 py-1 rounded-md font-medium">
              Resume
            </Link>
            <Link href="#contact" className="hover:text-gray-300">
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

