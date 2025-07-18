import { useEffect } from 'react'

export default function useScrollReveal(selector = '.reveal') {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
    if (elements.length === 0) return

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -20% 0px' })

    elements.forEach(el => observer.observe(el))
    return () => {
      elements.forEach(el => observer.unobserve(el))
    }
  }, [selector])
}
