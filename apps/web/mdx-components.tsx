import type { MDXComponents } from 'mdx/types'
 
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-8">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 mt-12">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 mt-8">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="space-y-3 mb-6">
        {children}
      </ul>
    ),
    li: ({ children }) => (
      <li className="text-gray-700 dark:text-gray-300 leading-relaxed flex items-start">
        <span className="text-blue-500 mr-3 mt-1">•</span>
        <span>{children}</span>
      </li>
    ),
    hr: () => (
      <hr className="border-gray-200 dark:border-gray-700 my-8" />
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    ...components,
  }
}