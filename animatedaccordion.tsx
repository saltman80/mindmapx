import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Item {
  q: string
  a: string
}

const AccordionItem: React.FC<Item> = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="accordion-item">
      <button className="accordion-header" onClick={() => setOpen(!open)}>
        {q}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="accordion-body"
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const AnimatedAccordion: React.FC<{ items: Item[] }> = ({ items }) => (
  <div className="accordion">
    {items.map(item => (
      <AccordionItem key={item.q} {...item} />
    ))}
  </div>
)

export default AnimatedAccordion
