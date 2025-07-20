import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Item {
  q: string
  a: string
}

interface AccordionItemProps extends Item {
  isOpen: boolean
  onToggle: () => void
}

const AccordionItem: React.FC<AccordionItemProps> = ({ q, a, isOpen, onToggle }) => {
  return (
    <div className="accordion-item">
      <button className="accordion-header" onClick={onToggle}>
        {q}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
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

const AnimatedAccordion: React.FC<{ items: Item[] }> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleIndex = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index))
  }

  return (
    <div className="accordion">
      {items.map((item, index) => (
        <AccordionItem
          key={item.q}
          {...item}
          isOpen={openIndex === index}
          onToggle={() => toggleIndex(index)}
        />
      ))}
    </div>
  )
}

export default AnimatedAccordion
