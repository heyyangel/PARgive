'use client'

import { motion } from 'framer-motion'

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  className = '',
  direction = 'up',
}: {
  children:   React.ReactNode
  delay?:     number
  duration?:  number
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}) {
  const offsets = {
    up:    { y: 30 },
    down:  { y: -30 },
    left:  { x: 30 },
    right: { x: -30 },
    none:  {},
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({
  children,
  className = '',
  stagger = 0.1,
}: {
  children:   React.ReactNode
  className?: string
  stagger?:   number
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className = '',
}: {
  children:   React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden:  { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {target.toLocaleString()}{suffix}
      </motion.span>
    </motion.span>
  )
}
