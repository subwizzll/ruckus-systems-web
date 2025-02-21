export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-6 text-center">
        <p>&copy; {new Date().getFullYear()} Jared Russell. All rights reserved.</p>
        <div className="mt-4 flex justify-center space-x-4">
          <a
            href="https://linkedin.com/in/ruckussystems"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/subwizzll"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            GitHub
          </a>
          <a href="mailto:jared@ruckussystems.dev" className="hover:text-gray-300">
          jared@ruckussystems.dev
          </a>
        </div>
      </div>
    </footer>
  )
}

