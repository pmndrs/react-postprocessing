import { lazy } from 'react'

export default {
  TakeControl: { descr: '', tags: [], Component: lazy(async () => await import('./TakeControl')), bright: false },
  Bubbles: { descr: '', tags: [], Component: lazy(async () => await import('./Bubbles')), bright: false },
}
